from __future__ import annotations

# services/api-gateway/app/services/etl_arbiter_agent.py
import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import logging
import subprocess
from typing import Dict, List, Optional
import uuid

from sqlalchemy import select

from app.libs.core.database import get_db_ctx
from app.libs.core.etl_state_machine import ETLState, ETLStateMachine
from app.libs.core.models.entities import ETLJob
from app.services.state_derivation import StateDerivationEngine


@dataclass
class ETLFact:
    job_id: str
    timestamp: datetime
    metric_type: str
    value: float
    source: str  # "etl_engine", "storage", "logs"

class ETLArbiterAgent:
    """Arbiter Agent for ETL. Does not execute ETL, only observes facts and derives state.
    Implements Axiom 8: Law of Derived ETL State.
    """

    def __init__(self, check_interval: int = 15):
        self.check_interval = check_interval
        self.logger = logging.getLogger("ETLArbiterAgent")
        self.engine = StateDerivationEngine()

    async def run(self):
        """Main loop of the arbiter agent."""
        self.logger.info("⚖️ ETL Arbiter Agent (v26.2) Started.")
        while True:
            try:
                # 1. Collect facts
                # In this implementation, 'facts' are retrieved from the Job's progress JSONB
                # which the ETL Engine updates. In a full Axiom 8 world, we would also pull from logs/metrics.
                async with get_db_ctx() as sess:
                    stmt = select(ETLJob).where(ETLJob.state.notin_([
                        ETLState.COMPLETED.value,
                        ETLState.FAILED.value,
                        ETLState.CANCELLED.value
                    ]))
                    result = await sess.execute(stmt)
                    active_jobs = result.scalars().all()

                    for job in active_jobs:
                        # 0. Stall Detection (v26 Requirement)
                        last_fact = job.progress.get("last_fact_at")
                        if last_fact:
                            last_dt = datetime.fromisoformat(last_fact)
                            if datetime.utcnow() - last_dt > timedelta(minutes=5):
                                self.logger.error(f"⚖️ Job {job.id} STALLED. Failing.")
                                await self.enforce_invariants(job, ["INV-005: Stalled Job"], ETLState.FAILED)
                                continue

                        # 1. Derive state from facts using the Sovereign Engine
                        # We simulate passing facts as a list (in real world we'd query fact table)
                        # For now, we use the Job's progress as the mock of latest facts summary
                        # In a full v26 world, we would pass the actual fact list.
                        # Since derivation engine expects facts, we'll wrap progress into a summary fact
                        facts_mock = [{"fact_type": "heartbeat", "timestamp": last_fact or datetime.utcnow().isoformat(), "payload": job.progress}]
                        derivation = self.engine.derive_state(facts_mock, ETLState(job.state))
                        derived_state = derivation["state"]

                        # 2. Validate Transition
                        if not derivation["transition_valid"]:
                            self.logger.warning(f"⚖️ Illegal transition for {job.id}: {derivation['violations']}")
                            continue

                        # 3. Check Invariants
                        violations = self.check_invariants(job, derived_state)

                        if violations:
                            # 5. Enforce with Specific Actions (v26 Requirement)
                            # Action: revert_to_INDEXING for INV-001 (fake completion)
                            if any("INV-001" in v for v in violations):
                                self.logger.info(f"⚖️ Fake Completion detected for {job.id}. Reverting to INDEXING.")
                                await self.record_state_to_ledger(job, derivation) # Pass full derivation
                            else:
                                await self.enforce_invariants(job, violations, derived_state)
                        # 6. Record legitimate state transition if it changed
                        elif job.state != derived_state.value:
                            self.logger.info(f"⚖️ Job {job.id}: Derived transition {job.state} -> {derived_state}")
                            await self.record_state_to_ledger(job, derivation)

                await asyncio.sleep(self.check_interval)

            except Exception as e:
                self.logger.exception(f"Arbiter Agent error: {e}")
                await asyncio.sleep(10)

    # derive_state method removed - utilizing StateDerivationEngine exclusively.

    def check_invariants(self, job: ETLJob, derived_state: ETLState) -> list[str]:
        """Verify invariants via OPA CLI."""
        input_data = {
            "state": derived_state.value,
            "metrics": job.progress or {}
        }

        try:
            result = subprocess.run(
                ["opa", "eval", "--data", "policies/opa/etl_invariants.rego",
                 "--input", "-", "data.predator.etl.invariants"],
                check=False, input=json.dumps(input_data).encode(),
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                return ["OPA_EXEC_ERROR"]

            output = json.loads(result.stdout)
            violations = []

            # Violation-oriented parsing: result: [{ "expressions": [{ "value": [ { "id": "...", "msg": "..." } ] }] }]
            if output.get("result"):
                expressions = output["result"][0].get("expressions", [])
                if expressions:
                    violation_list = expressions[0].get("value", [])
                    for v in violation_list:
                        violations.append(f"{v['id']}: {v['msg']}")

            return violations
        except Exception as e:
            self.logger.exception(f"OPA check failed: {e}")
            return ["OPA_FAILURE"]

    async def enforce_invariants(self, job: ETLJob, violations: list[str], derived_state: ETLState):
        """Action when invariants are violated."""
        self.logger.warning(f"⚖️ Invariant Violation for {job.id}: {violations}")

        # Force fail through CLI or direct DB update (CLI preferred for auditing)
        subprocess.run(["python3", "scripts/predatorctl.py", "etl", "force-fail", str(job.id), f"Arbiter Violation: {', '.join(violations)}"], check=False)

    async def record_state_to_ledger(self, job: ETLJob, derivation: dict):
        """Record the derived state transition into the Truth Ledger with canonical hashing and chaining."""
        import hashlib

        from sqlalchemy import text  # Ensure text is imported

        derived_state = derivation["state"]
        evidence_hash = derivation["evidence_hash"]
        metrics = derivation["metrics"]
        confidence = derivation["confidence"]
        violations = derivation.get("violations", [])

        async with get_db_ctx() as sess:
            # 1. Get previous decision hash for chaining
            prev_result = await sess.execute(
                text("SELECT decision_hash, derived_state FROM truth.etl_state_decisions WHERE job_id = :jid ORDER BY derived_at DESC LIMIT 1"),
                {"jid": str(job.id)}
            )
            prev_row = prev_result.fetchone()
            previous_hash = prev_row.decision_hash if prev_row else None
            previous_state = prev_row.derived_state if prev_row else None

            # Calculate Decision Hash (Chained)
            decision_payload = f"{job.id}{previous_hash}{derived_state.value}{evidence_hash}{confidence}"
            decision_hash = hashlib.sha256(decision_payload.encode()).hexdigest()

            # 2. Insert into Ledger
            await sess.execute(
                text("""
                    INSERT INTO truth.etl_state_decisions (
                        job_id, previous_state, derived_state,
                        evidence_hash, evidence_summary, confidence_score,
                        arbiter_version, derivation_algorithm, violations_detected,
                        previous_decision_hash, decision_hash, derived_by
                    ) VALUES (
                        :jid, :p_state, :d_state,
                        :ev_hash, :ev_sum, :conf,
                        'v26.2', 'StateDerivationEngine', :vios,
                        :prev_hash, :dec_hash, 'ETLArbiterAgent'
                    )
                """),
                {
                    "jid": str(job.id),
                    "p_state": previous_state,
                    "d_state": derived_state.value,
                    "ev_hash": evidence_hash,
                    "ev_sum": json.dumps(metrics),
                    "conf": confidence,
                    "vios": json.dumps(violations),
                    "prev_hash": previous_hash,
                    "dec_hash": decision_hash
                }
            )

            # 3. Update Job State (The Result)
            # Only if legitimate (no violations forcing failure, which is handled elsewhere or here if needed)
            # If we are recording a forced revert (like INV-001), we update the job too.
            db_job = await sess.get(ETLJob, job.id)
            if db_job and db_job.state != derived_state.value:
                db_job.state = derived_state.value
                # Also update json progress with new derivation metadata
                if not db_job.progress: db_job.progress = {}
                db_job.progress["last_derived_at"] = datetime.utcnow().isoformat()
                db_job.progress["last_evidence_hash"] = evidence_hash

            await sess.commit()
