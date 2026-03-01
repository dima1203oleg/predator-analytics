from __future__ import annotations

# services/api_gateway/app/services/state_derivation.py
from datetime import datetime
from enum import StrEnum
import hashlib
import json
import uuid


class ETLState(StrEnum):
    CREATED = "CREATED"
    UPLOADING = "UPLOADING"
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    INDEXING = "INDEXING"
    INDEXED = "INDEXED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    UPLOAD_FAILED = "UPLOAD_FAILED"
    PROCESSING_FAILED = "PROCESSING_FAILED"
    INDEXING_FAILED = "INDEXING_FAILED"


class StateDerivationEngine:
    """Sovereign State Derivation Engine (Law of Derived ETL State v45).
    The sole authority for calculating ETL job states based on emitted facts.
    """

    ALLOWED_TRANSITIONS = {
        ETLState.CREATED: {ETLState.UPLOADING},
        ETLState.UPLOADING: {ETLState.UPLOADED, ETLState.UPLOAD_FAILED, ETLState.CANCELLED},
        ETLState.UPLOADED: {ETLState.PROCESSING},
        ETLState.PROCESSING: {ETLState.PROCESSED, ETLState.PROCESSING_FAILED, ETLState.CANCELLED},
        ETLState.PROCESSED: {ETLState.INDEXING},
        ETLState.INDEXING: {ETLState.INDEXED, ETLState.INDEXING_FAILED, ETLState.CANCELLED},
        ETLState.INDEXED: {ETLState.COMPLETED},
        ETLState.UPLOAD_FAILED: {ETLState.FAILED},
        ETLState.PROCESSING_FAILED: {ETLState.FAILED},
        ETLState.INDEXING_FAILED: {ETLState.FAILED},
    }

    TERMINAL_STATES = {ETLState.COMPLETED, ETLState.FAILED, ETLState.CANCELLED}

    def derive_state(self, facts: list[dict], previous_state: ETLState | None) -> dict:
        """Derive state with transition validation and evidence hashing."""
        metrics = self._aggregate_metrics(facts)
        derived_state = self._derive_from_metrics(metrics, facts)

        transition_valid = True

        if (
            previous_state
            and previous_state in self.TERMINAL_STATES
            and derived_state != previous_state
        ):
            transition_valid = False
        # 1. Compute Evidence Hash
        evidence_hash = self._compute_evidence_hash(facts)

        # 2. Heartbeat Violation Check
        heartbeat_violation = self._check_heartbeat_violation(facts, derived_state)

        # 3. Transition Validation (Axiom 1)
        transition_valid = self._validate_transition(previous_state, derived_state)

        # 4. Monotonicity Check (Axiom 9)
        # We need history for this. For now, we mock history or pass it in if available.
        # Ideally, 'derive_state_with_history' should be used.
        # Assuming single-step derivation doesn't know history unless passed.
        # If 'metrics' contains 'previous_metrics' (hack for regulation), use it.
        monotonicity_violations = []
        if "previous_metrics" in metrics:
            monotonicity_violations = self._check_monotonicity(
                [{"metrics": metrics["previous_metrics"]}], metrics
            )

        # 5. Policy Check (OPA)
        # We do this simulating the OPA input for additional rigorous checks
        # In a real deployed agent, 'etl_arbiter_agent.py' does the OPA CLI call.
        # Here we do Python-native logic validation.
        violations = []
        if not transition_valid:
            violations.append(f"ILLEGAL_TRANSITION: {previous_state} -> {derived_state}")
        violations.extend(monotonicity_violations)
        if heartbeat_violation:
            violations.append(heartbeat_violation)

        # 6. Confidence Score
        confidence = self._calculate_confidence(
            previous_state, derived_state, {"transition_valid": transition_valid}, violations
        )

        return {
            "state": derived_state,
            "confidence": confidence,
            "evidence_hash": evidence_hash,
            "violations": violations,
            "metrics": metrics,
            "transition_valid": transition_valid,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _aggregate_metrics(self, facts: list[dict]) -> dict:
        metrics = {
            "records_total": 0,
            "records_processed": 0,
            "records_indexed": 0,
            "bytes_processed": 0,
            "bytes_total": 0,
            "error_count": 0,
            "last_heartbeat": None,
        }
        for fact in facts:
            ftype = fact.get("fact_type")
            payload = fact.get("payload") or {}

            if ftype in ["row_parsed", "processing_completed"]:
                metrics["records_processed"] = payload.get(
                    "rows_processed", metrics["records_processed"]
                )
                metrics["records_total"] = payload.get("total_rows", metrics["records_total"])
            elif ftype in ["batch_indexed", "indexing_completed"]:
                metrics["records_indexed"] = payload.get("rows_indexed", metrics["records_indexed"])
            elif ftype in ["file_upload_progress", "file_upload_completed"]:
                metrics["bytes_processed"] = payload.get(
                    "bytes_processed", metrics["bytes_processed"]
                )
                metrics["bytes_total"] = payload.get("total_bytes", metrics["bytes_total"])
            elif ftype == "error_occurred":
                metrics["error_count"] += 1
            elif ftype == "heartbeat":
                metrics["last_heartbeat"] = fact.get("timestamp")

        return metrics

    def _derive_from_metrics(self, metrics: dict, facts: list[dict]) -> ETLState:
        if metrics["error_count"] > 0:
            # Determine stage for error state
            for fact in reversed(facts):
                if fact.get("fact_type") == "error_occurred":
                    ctx = fact.get("payload", {}).get("error_context", {})
                    stage = ctx.get("stage", "")
                    if "upload" in stage:
                        return ETLState.UPLOAD_FAILED
                    if "processing" in stage:
                        return ETLState.PROCESSING_FAILED
                    if "indexing" in stage:
                        return ETLState.INDEXING_FAILED
            return ETLState.FAILED

        if (
            metrics["records_indexed"] > 0
            and metrics["records_indexed"] >= metrics["records_total"]
        ):
            return ETLState.COMPLETED
        if metrics["records_indexed"] > 0:
            return ETLState.INDEXING
        if (
            metrics["records_processed"] > 0
            and metrics["records_processed"] >= metrics["records_total"]
        ):
            return ETLState.PROCESSED
        if metrics["records_processed"] > 0:
            return ETLState.PROCESSING
        if metrics["bytes_processed"] > 0 and metrics["bytes_processed"] >= metrics["bytes_total"]:
            return ETLState.UPLOADED
        if metrics["bytes_processed"] > 0:
            return ETLState.UPLOADING
        return ETLState.CREATED

    def _check_heartbeat_violation(self, facts: list[dict], state: ETLState) -> str | None:
        if state in {ETLState.UPLOADING, ETLState.PROCESSING, ETLState.INDEXING}:
            heartbeats = [f for f in facts if f.get("fact_type") == "heartbeat"]
            if not heartbeats:
                return None  # Initial state
            latest = max(heartbeats, key=lambda x: x["timestamp"])
            last_ts = datetime.fromisoformat(latest["timestamp"])
            gap = (datetime.utcnow() - last_ts).total_seconds()
            if gap > 120:
                return f"Heartbeat gap {gap:.1f}s exceeds SLA (120s) in state {state}"
        return None

    def _compute_evidence_hash(self, facts: list[dict]) -> str:
        sorted_facts = sorted(facts, key=lambda x: x.get("fact_id", str(uuid.uuid4())))
        canonical_json = json.dumps(sorted_facts, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical_json.encode()).hexdigest()

    def _validate_transition(
        self, previous_state: ETLState | None, derived_state: ETLState
    ) -> bool:
        if previous_state:
            if previous_state in self.TERMINAL_STATES and derived_state != previous_state:
                return False  # Terminal state violation
            if (
                derived_state != previous_state
                and derived_state not in self.ALLOWED_TRANSITIONS.get(previous_state, set())
            ):
                return False  # Illegal transition
        return True

    def _calculate_confidence(
        self, db_state: ETLState, derived_state: ETLState, verification: dict, violations: list
    ) -> float:
        """Calculate confidence based on Constitution 'Confidence Law'.
        rules:
          - if violations == 0 and verification_passed == true -> confidence = 1.0
          - if violations > 0 -> confidence < 0.7
          - if verification_failed -> confidence < 0.5.
        """
        # Base confidence
        confidence = 1.0

        # Penalties based on Law
        if violations:
            confidence = 0.6  # Cap at < 0.7 for violations
            if any("INV-007" in v for v in violations):  # Monotonicity violation is severe
                confidence = 0.3

        if not verification.get("transition_valid", False):
            confidence = 0.4  # Cap at < 0.5 for invalid transitions

        # Additional heuristics (minor)
        if db_state == derived_state:
            confidence += 0.0  # No penalty, stable
        else:
            # Transitioning state is slightly less confident until confirmed?
            # Actually, per Law, if no violations, it's 1.0. Law overrides heuristics.
            pass

        return min(max(confidence, 0.0), 1.0)

    def _check_monotonicity(self, history: list[dict], current_metrics: dict) -> list[str]:
        """Check Axiom 9: Law of Monotonic Facts.
        Facts cannot decrease over time.
        """
        if not history:
            return []

        violations = []
        # Get latest legitimate historical snapshot
        # For simplicity, we assume history is sorted or we take the last one
        last_proven = history[-1].get("metrics", {})

        # Check specific additive counters
        monitored_fields = ["records_processed", "records_indexed", "records_total"]

        for field in monitored_fields:
            curr_val = current_metrics.get(field, 0)
            prev_val = last_proven.get(field, 0)

            # Allow equal, forbid strictly less
            if curr_val < prev_val:
                violations.append(f"INV-007: Non-monotonic {field} ({curr_val} < {prev_val})")

        return violations
