from __future__ import annotations

import asyncio
import contextlib
from datetime import datetime, timedelta
import hashlib
import json
import logging

from sqlalchemy import desc, select

from app.libs.core.database import get_db_ctx
from app.libs.core.etl_state_machine import ETLState, ETLStateMachine
from app.libs.core.models.entities import ETLJob
from app.libs.core.models.truth_ledger import TruthLedger


logger = logging.getLogger("service.etl_arbiter")


class ETLArbiter:
    """ARBITER SYSTEM for Predator Analytics v45.
    Ensures Truth, Invariants, and Progress correctness.
    Records all decisions to the Constitutional Truth Ledger.
    """

    def __init__(self):
        self.running = False
        self._task = None
        self.check_interval = 60  # Check every minute

    async def start(self):
        self.running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("⚖️ ETL Arbiter started. Watching for invariant violations.")

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
        logger.info("ETL Arbiter stopped.")

    async def _loop(self):
        while self.running:
            try:
                await self.run_checks()
            except Exception as e:
                logger.exception(f"Arbiter check failed: {e}")

            await asyncio.sleep(self.check_interval)

    async def run_checks(self):
        """Run all arbiter checks."""
        async with get_db_ctx() as sess:
            # Fetch active jobs
            # Fetch active jobs + recently completed (for audit)
            # Active (not terminal)
            stmt = select(ETLJob).where(
                ETLJob.state.notin_([ETLState.COMPLETED.value, ETLState.FAILED.value, ETLState.CANCELLED.value])
            )
            result = await sess.execute(stmt)
            active_jobs = result.scalars().all()

            for job in active_jobs:
                await self._check_job(sess, job)

            # Audit Check: Recent COMPLETED jobs (Double check logic)
            # In a real heavy system we might do this async or less frequent
            # For now, rely on active check catching INDEXED before completion or Ingestion Service doing it right.
            # To be safe per spec "No Fake Completion":
            cutoff = datetime.utcnow() - timedelta(minutes=10)
            audit_stmt = select(ETLJob).where((ETLJob.state == ETLState.COMPLETED.value) & (ETLJob.updated_at > cutoff))
            audit_res = await sess.execute(audit_stmt)
            for job in audit_res.scalars().all():
                await self._check_job(sess, job)

    async def _check_job(self, sess, job: ETLJob):
        """Check invariants for a single job."""
        # 1. No Stalled Progress (Heartbeat Check)
        updated_at = job.updated_at or job.created_at

        # Threshold: 5 mins for processing, 1 min for upload, 10 min for indexing
        threshold_map = {
            ETLState.UPLOADING.value: timedelta(minutes=2),
            ETLState.PROCESSING.value: timedelta(minutes=5),
            ETLState.INDEXING.value: timedelta(minutes=10),
        }
        limit = threshold_map.get(job.state, timedelta(minutes=5))

        if datetime.utcnow() - updated_at > limit:
            logger.warning(f"⚖️ Arbiter detected STALLED job {job.id}. State: {job.state}. Last update: {updated_at}")
            await self._fail_job(
                sess, job, f"Arbiter Timeout: Job stalled in {job.state} for > {limit.seconds // 60} mins"
            )
            return

        # 2. Progress Truth Check
        computed_percent = ETLStateMachine.get_progress(ETLState(job.state), job.progress or {})
        current_percent = job.progress.get("percent", 0) if job.progress else 0

        # Force sync if discrepancy > 2% (Stickier Arbiter)
        if abs(computed_percent - current_percent) > 2:
            # logger.info(f"⚖️ Arbiter sync progress for {job.id}: {current_percent}% -> {computed_percent}%")
            job.progress = {**(job.progress or {}), "percent": computed_percent}
            sess.add(job)
            await sess.commit()

        # 3. Indexing Invariant (No Zero Indexing)
        # Check this for both INDEXED and COMPLETED if records_total > 0
        if job.state in [ETLState.INDEXED.value, ETLState.COMPLETED.value]:
            indexed = (job.progress or {}).get("records_indexed", 0)
            total = (job.progress or {}).get("records_total", 0)

            if total > 0 and indexed == 0:
                logger.error(f"⚖️ Arbiter violation: Job {job.id} is {job.state} but records_indexed=0")
                await self._fail_job(sess, job, "Arbiter Violation: Zero records indexed (Fake Completion)")

    async def _fail_job(self, sess, job: ETLJob, reason: str):
        """Fail a job and record it in the Truth Ledger."""
        prev_state = job.state
        job.state = ETLState.FAILED.value
        job.errors = (job.errors or []) + [{"message": reason, "at": datetime.utcnow().isoformat()}]
        job.updated_at = datetime.utcnow()
        sess.add(job)

        # Record strict verdict
        await self._record_verdict(sess, job, "FORCED_FAIL", prev_state, reason)

        await sess.commit()
        logger.info(f"⚖️ Arbiter FAIL applied to {job.id}")

    async def _record_verdict(self, sess, job: ETLJob, decision: str, prev_state: str, reason: str | None = None):
        """Record a decision into the Truth Ledger with cryptographic chaining."""
        # 1. Get previous hash (Simple implementation: last hash for this job, or global genesis)
        # For simplicity in v45.0 locally, let's chain per job.
        # Ideally: Global Merkle Tree.
        stmt = (
            select(TruthLedger).where(TruthLedger.job_id == str(job.id)).order_by(desc(TruthLedger.created_at)).limit(1)
        )
        res = await sess.execute(stmt)
        last_entry = res.scalar_one_or_none()

        prev_hash = last_entry.current_hash if last_entry else None

        # 2. Calculate new hash (Python side for verification)
        # Payload matched to SQL trigger logic
        # job_id + prev + new + metrics + prev_hash + tier
        payload = (
            str(job.id)
            + str(prev_state)
            + str(job.state)
            + json.dumps(job.progress or {})
            + (prev_hash or "GENESIS")
            + "basic"  # tier
        )
        current_hash = hashlib.sha256(payload.encode()).hexdigest()

        # 3. Create Entry
        entry = TruthLedger(
            job_id=str(job.id),
            previous_state=str(prev_state),
            new_state=str(job.state),
            real_metrics=job.progress or {},
            arbiter_decision=decision,
            arbiter_reason=reason,
            previous_hash=prev_hash,
            current_hash=current_hash,
            consensus_tier="basic",
            created_by="etl_arbiter",
        )
        sess.add(entry)


etl_arbiter = ETLArbiter()
