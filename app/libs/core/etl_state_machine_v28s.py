from __future__ import annotations


"""Enhanced ETL State Machine v45-S - AZR Engine
Core business logic for ETL transitions and constitutional invariants.
"""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

import yaml


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

class ETLStateMachineV45S:
    VERSION = "v45-S"
    INTEGRATION = "Sovereign Observer Module"

    TRANSITIONS = {
        ETLState.CREATED: [ETLState.UPLOADING],
        ETLState.UPLOADING: [ETLState.UPLOADED, ETLState.UPLOAD_FAILED, ETLState.CANCELLED],
        ETLState.UPLOADED: [ETLState.PROCESSING],
        ETLState.PROCESSING: [ETLState.PROCESSED, ETLState.PROCESSING_FAILED, ETLState.CANCELLED],
        ETLState.PROCESSED: [ETLState.INDEXING],
        ETLState.INDEXING: [ETLState.INDEXED, ETLState.INDEXING_FAILED, ETLState.CANCELLED],
        ETLState.INDEXED: [ETLState.COMPLETED],

        # Error handling
        ETLState.UPLOAD_FAILED: [ETLState.FAILED],
        ETLState.PROCESSING_FAILED: [ETLState.FAILED],
        ETLState.INDEXING_FAILED: [ETLState.FAILED]
    }

    TERMINAL_STATES = {ETLState.COMPLETED, ETLState.FAILED, ETLState.CANCELLED}

    @classmethod
    def can_transition(cls, current_state: ETLState, next_state: ETLState) -> bool:
        if current_state == next_state: return True
        return next_state in cls.TRANSITIONS.get(current_state, [])

    @classmethod
    def get_progress(cls, state: ETLState, context: dict[str, Any]) -> int:
        """Calculates REAL progress based on v45-S Formal Requirements."""
        if state == ETLState.CREATED: return 0

        if state == ETLState.UPLOADING:
             uploaded = context.get("bytes_uploaded", 0)
             total = context.get("bytes_total", 1) or 1
             return min(int((uploaded / total) * 10), 9)

        if state == ETLState.UPLOADED: return 10

        if state == ETLState.PROCESSING:
             processed = context.get("records_processed", 0)
             total = context.get("records_total", 1) or 1
             return 10 + int((processed / total) * 40) # 10% -> 50%

        if state == ETLState.PROCESSED: return 50

        if state == ETLState.INDEXING:
             indexed = context.get("records_indexed", 0)
             total = context.get("records_total", 1) or 1
             return 50 + int((indexed / total) * 45) # 50% -> 95%

        if state == ETLState.INDEXED: return 99

        if state == ETLState.COMPLETED: return 100

        # Terminals (FAILED/CANCELLED) keep last progress
        return context.get("percent", 0)

    @classmethod
    def validate_invariants(cls, state: ETLState, context: dict[str, Any]) -> list[str]:
        violations = []

        # AXIOM-001: No simulation data
        if context.get("is_simulation"):
            violations.append("ETL-AXIOM-001: Simulation data detected in production pipeline")

        # AXIOM-003: Progress <= 100
        progress = cls.get_progress(state, context)
        if progress > 100:
            violations.append("ETL-AXIOM-003: Progress overflow detected")

        # AXIOM-004: No zero indexing with data
        if state == ETLState.INDEXED:
            records_total = context.get("records_total", 0)
            records_indexed = context.get("records_indexed", 0)
            if records_total > 0 and records_indexed == 0 and not context.get("allow_empty"):
                violations.append("ETL-AXIOM-004: Zero indexing result for non-empty input")

        return violations
