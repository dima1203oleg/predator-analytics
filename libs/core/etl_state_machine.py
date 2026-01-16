"""
ETL State Machine Logic
Core business logic for ETL transitions and invariants.
"""
from enum import Enum
from datetime import datetime
from typing import Dict, Any, List

class ETLState(str, Enum):
    # Lifecycle
    CREATED = "CREATED"
    UPLOADING = "UPLOADING"
    UPLOAD_FAILED = "UPLOAD_FAILED"
    UPLOADED = "UPLOADED"

    # Processing
    PROCESSING = "PROCESSING"
    PROCESSING_FAILED = "PROCESSING_FAILED"
    PROCESSED = "PROCESSED"

    # Indexing
    INDEXING = "INDEXING"
    INDEXING_FAILED = "INDEXING_FAILED"
    INDEXED = "INDEXED"

    # Final
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class ETLStateMachine:
    VERSION = "1.0"

    TRANSITIONS = {
        ETLState.CREATED: [ETLState.UPLOADING],
        ETLState.UPLOADING: [ETLState.UPLOADED, ETLState.UPLOAD_FAILED, ETLState.CANCELLED],
        ETLState.UPLOADED: [ETLState.PROCESSING],
        ETLState.PROCESSING: [ETLState.PROCESSED, ETLState.PROCESSING_FAILED, ETLState.CANCELLED],
        ETLState.PROCESSED: [ETLState.INDEXING],
        ETLState.INDEXING: [ETLState.INDEXED, ETLState.INDEXING_FAILED, ETLState.CANCELLED],
        ETLState.INDEXED: [ETLState.COMPLETED],

        # Terminal logic
        ETLState.UPLOAD_FAILED: [ETLState.FAILED],
        ETLState.PROCESSING_FAILED: [ETLState.FAILED],
        ETLState.INDEXING_FAILED: [ETLState.FAILED]
    }

    TERMINAL_STATES = {ETLState.COMPLETED, ETLState.FAILED, ETLState.CANCELLED}

    @classmethod
    def can_transition(cls, current_state: ETLState, next_state: ETLState) -> bool:
        """Check if a transition is allowed by the formal state machine."""
        if current_state == next_state:
            return True
        return next_state.value in cls.TRANSITIONS.get(current_state.value, [])

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
        """
        Calculates REAL progress based on v26 Formal Requirements.
        No optimistic jumps. No faking.
        """
        if state == ETLState.CREATED: return 0
        if state == ETLState.UPLOADING:
             # UPLOADING: bytes_transferred / bytes_total
             transferred = context.get("bytes_transferred", 0)
             total = context.get("bytes_total", 1) or 1
             return min(int((transferred / total) * 10), 9)

        if state == ETLState.UPLOADED: return 10

        if state == ETLState.PROCESSING:
             # PROCESSING: records_processed / records_total
             processed = context.get("records_processed", 0)
             total = context.get("records_total", 1) or 1
             ratio = processed / total
             return 10 + int(ratio * 40) # 10% -> 50%

        if state == ETLState.PROCESSED: return 50

        if state == ETLState.INDEXING:
             # INDEXING: documents_indexed / documents_total
             indexed = context.get("records_indexed", 0)
             total = context.get("records_total", 1) or 1
             ratio = indexed / total
             return 50 + int(ratio * 45) # 50% -> 95%

        if state == ETLState.INDEXED: return 99 # 100 only after final audit

        if state == ETLState.COMPLETED: return 100

        # Terminals (FAILED/CANCELLED) stay at their last known percent
        if state in cls.TERMINAL_STATES:
             return context.get("percent", 0)

        return context.get("percent", 0)
