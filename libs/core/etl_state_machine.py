"""
ETL State Machine Logic
Core business logic for ETL transitions and invariants.
"""
from enum import Enum
from datetime import datetime
from typing import Dict, Any, List

class ETLState(str, Enum):
    CREATED = "CREATED"
    UPLOADING = "UPLOADING"
    UPLOAD_FAILED = "UPLOAD_FAILED"
    UPLOADED = "UPLOADED"

    PROCESSING = "PROCESSING"
    PROCESSING_FAILED = "PROCESSING_FAILED"
    PROCESSED = "PROCESSED"

    INDEXING = "INDEXING"
    INDEXING_FAILED = "INDEXING_FAILED"
    INDEXED = "INDEXED"

    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class ETLStateMachine:
    TRANSITIONS = {
        ETLState.CREATED: [ETLState.UPLOADING],
        ETLState.UPLOADING: [ETLState.UPLOADED, ETLState.UPLOAD_FAILED, ETLState.CANCELLED],
        ETLState.UPLOADED: [ETLState.PROCESSING],
        ETLState.PROCESSING: [ETLState.PROCESSED, ETLState.PROCESSING_FAILED, ETLState.CANCELLED],
        ETLState.PROCESSED: [ETLState.INDEXING],
        ETLState.INDEXING: [ETLState.INDEXED, ETLState.INDEXING_FAILED, ETLState.CANCELLED],
        ETLState.INDEXED: [ETLState.COMPLETED],

        ETLState.UPLOAD_FAILED: [ETLState.FAILED],
        ETLState.PROCESSING_FAILED: [ETLState.FAILED],
        ETLState.INDEXING_FAILED: [ETLState.FAILED]
    }

    TERMINAL_STATES = {ETLState.COMPLETED, ETLState.FAILED, ETLState.CANCELLED}

    @staticmethod
    def can_transition(current: ETLState, next_state: ETLState) -> bool:
        if current in ETLStateMachine.TERMINAL_STATES:
            return False
        allowed = ETLStateMachine.TRANSITIONS.get(current, [])
        return next_state in allowed

    @staticmethod
    def get_progress(state: ETLState, context: Dict[str, Any]) -> int:
        """Calculate deterministic progress percentage based on state."""
        if state == ETLState.CREATED: return 0
        if state == ETLState.UPLOADING: return 10
        if state == ETLState.UPLOADED: return 20
        # PROCESSING: 20-60%
        if state == ETLState.PROCESSING:
            processed = context.get("records_processed", 0)
            total = context.get("records_total", 1) or 1
            ratio = min(processed / total, 1.0)
            return 20 + int(ratio * 40)

        if state == ETLState.PROCESSED: return 60

        # INDEXING: 60-95%
        if state == ETLState.INDEXING:
            indexed = context.get("records_indexed", 0)
            total = context.get("records_total", 1) or 1
            ratio = min(indexed / total, 1.0)
            return 60 + int(ratio * 35)

        if state == ETLState.INDEXED: return 95
        if state == ETLState.COMPLETED: return 100

        # Failures freeze at current or default to range start
        if state == ETLState.UPLOAD_FAILED: return 10
        if state == ETLState.PROCESSING_FAILED: return context.get("percent", 20)
        if state == ETLState.INDEXING_FAILED: return context.get("percent", 60)
        if state == ETLState.FAILED: return context.get("percent", 0)
        if state == ETLState.CANCELLED: return context.get("percent", 0)

        return 0
