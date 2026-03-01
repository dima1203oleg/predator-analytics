from __future__ import annotations


"""ETL State Machine Logic
Core business logic for ETL transitions and invariants.
"""
from enum import StrEnum


class ETLState(StrEnum):
    # Lifecycle
    CREATED = "CREATED"
    SOURCE_CHECKED = "SOURCE_CHECKED"
    INGESTED = "INGESTED"  # MinIO
    PARSED = "PARSED"
    VALIDATED = "VALIDATED"  # DQ Check
    TRANSFORMED = "TRANSFORMED"
    ENTITIES_RESOLVED = "ENTITIES_RESOLVED"
    LOADED = "LOADED"  # PostgreSQL
    GRAPH_BUILT = "GRAPH_BUILT"
    INDEXED = "INDEXED"  # OpenSearch
    VECTORIZED = "VECTORIZED"  # Qdrant
    READY = "READY"

    # Terminal/Failure
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class ETLStateMachine:
    VERSION = "2.0"

    # Linear progression per requirements
    TRANSITIONS = {
        ETLState.CREATED: [ETLState.SOURCE_CHECKED, ETLState.FAILED],
        ETLState.SOURCE_CHECKED: [ETLState.INGESTED, ETLState.FAILED],
        ETLState.INGESTED: [ETLState.PARSED, ETLState.FAILED],
        ETLState.PARSED: [ETLState.VALIDATED, ETLState.FAILED],
        ETLState.VALIDATED: [ETLState.TRANSFORMED, ETLState.FAILED],
        ETLState.TRANSFORMED: [ETLState.ENTITIES_RESOLVED, ETLState.FAILED],
        ETLState.ENTITIES_RESOLVED: [ETLState.LOADED, ETLState.FAILED],
        ETLState.LOADED: [ETLState.GRAPH_BUILT, ETLState.FAILED],
        ETLState.GRAPH_BUILT: [ETLState.INDEXED, ETLState.FAILED],
        ETLState.INDEXED: [ETLState.VECTORIZED, ETLState.FAILED],
        ETLState.VECTORIZED: [ETLState.READY, ETLState.FAILED],
    }

    TERMINAL_STATES = {ETLState.READY, ETLState.FAILED, ETLState.CANCELLED}

    @classmethod
    def can_transition(cls, current_state: ETLState, next_state: ETLState) -> bool:
        if current_state == next_state:
            return True
        allowed = cls.TRANSITIONS.get(current_state, [])
        return next_state in allowed

    @classmethod
    def is_valid_transition(cls, current_state_val: str, next_state_val: str) -> bool:
        """String-based helper for Arbiter validation."""
        try:
            curr = ETLState(current_state_val)
            nxt = ETLState(next_state_val)
            return cls.can_transition(curr, nxt)
        except ValueError:
            return False

    @classmethod
    def get_progress(cls, state: ETLState, context: dict) -> int:
        """Calculates granular progress across 11 stages."""
        stages_order = [
            ETLState.CREATED,
            ETLState.SOURCE_CHECKED,
            ETLState.INGESTED,
            ETLState.PARSED,
            ETLState.VALIDATED,
            ETLState.TRANSFORMED,
            ETLState.ENTITIES_RESOLVED,
            ETLState.LOADED,
            ETLState.GRAPH_BUILT,
            ETLState.INDEXED,
            ETLState.VECTORIZED,
            ETLState.READY,
        ]

        try:
            current_idx = stages_order.index(state)
            base_progress = int((current_idx / (len(stages_order) - 1)) * 100)

            # Sub-progress for long operations
            if state == ETLState.PARSED:
                records = context.get("records_processed", 0)
                total = context.get("records_total", 1) or 1
                return base_progress + int((records / total) * 8)

            if state == ETLState.VECTORIZED:
                indexed = context.get("records_indexed", 0)
                total = context.get("records_total", 1) or 1
                return base_progress + int((indexed / total) * 8)

            return base_progress
        except (ValueError, ZeroDivisionError):
            return 0
