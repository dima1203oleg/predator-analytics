from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
import os
import sys
from typing import Any, Dict
import unittest


# Add project root
sys.path.append(os.getcwd())
# Add api-gateway root to find 'app'
sys.path.append(os.path.join(os.getcwd(), "services/api-gateway"))

import pytest

from app.services.etl_arbiter import ETLArbiter  # Now valid because 'app' is in path
from libs.core.etl_state_machine import ETLState, ETLStateMachine


class TestETLTruthfulness(unittest.TestCase):

    def test_state_transitions(self):
        """Verify strict state machine transitions."""
        # Valid
        assert ETLStateMachine.can_transition(ETLState.CREATED, ETLState.UPLOADING)
        assert ETLStateMachine.can_transition(ETLState.PROCESSING, ETLState.PROCESSED)

        # Invalid (Skipping steps)
        assert not ETLStateMachine.can_transition(ETLState.CREATED, ETLState.PROCESSING)
        assert not ETLStateMachine.can_transition(ETLState.PROCESSED, ETLState.COMPLETED) # Must go INDEXING->INDEXED first

    def test_invariants_indexing(self):
        """Verify 'No Zero Indexing' invariant."""
        # Case: 1000 records total, 0 indexed -> ERROR
        context = {"records_total": 1000, "records_indexed": 0}
        with pytest.raises(ValueError):
            ETLStateMachine.validate_invariants(ETLState.INDEXED, context)

        # Case: 1000 records total, 1000 indexed -> OK
        context = {"records_total": 1000, "records_indexed": 1000}
        try:
            ETLStateMachine.validate_invariants(ETLState.INDEXED, context)
        except ValueError:
            self.fail("Invariant raised ValueError unexpectedly for valid data")

    def test_progress_calculation(self):
        """Verify deterministic progress calculation."""
        # Uploading = 10%
        p = ETLStateMachine.get_progress(ETLState.UPLOADING, {})
        assert p == 10

        # Processing 50% (500/1000) -> Mapped to range 20-60 -> should be 40%
        context = {"records_processed": 500, "records_total": 1000}
        p = ETLStateMachine.get_progress(ETLState.PROCESSING, context)
        # 20 + (0.5 * 40) = 40
        assert p == 40

        # Processing 100% (1000/1000) -> 60%
        context = {"records_processed": 1000, "records_total": 1000}
        p = ETLStateMachine.get_progress(ETLState.PROCESSING, context)
        assert p == 60

        # Indexing 50% (500/1000) -> Range 60-90 -> 75%
        context = {"records_indexed": 500, "records_total": 1000}
        p = ETLStateMachine.get_progress(ETLState.INDEXING, context)
        # 60 + (0.5 * 30) = 75
        assert p == 75

if __name__ == '__main__':
    unittest.main()
