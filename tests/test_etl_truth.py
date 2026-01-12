
import asyncio
import unittest
from datetime import datetime, timedelta
from typing import Dict, Any

import sys
import os
# Add project root
sys.path.append(os.getcwd())
# Add api-gateway root to find 'app'
sys.path.append(os.path.join(os.getcwd(), "services/api-gateway"))

from libs.core.etl_state_machine import ETLStateMachine, ETLState
from app.services.etl_arbiter import ETLArbiter # Now valid because 'app' is in path

class TestETLTruthfulness(unittest.TestCase):

    def test_state_transitions(self):
        """Verify strict state machine transitions."""
        # Valid
        self.assertTrue(ETLStateMachine.can_transition(ETLState.CREATED, ETLState.UPLOADING))
        self.assertTrue(ETLStateMachine.can_transition(ETLState.PROCESSING, ETLState.PROCESSED))

        # Invalid (Skipping steps)
        self.assertFalse(ETLStateMachine.can_transition(ETLState.CREATED, ETLState.PROCESSING))
        self.assertFalse(ETLStateMachine.can_transition(ETLState.PROCESSED, ETLState.COMPLETED)) # Must go INDEXING->INDEXED first

    def test_invariants_indexing(self):
        """Verify 'No Zero Indexing' invariant."""
        # Case: 1000 records total, 0 indexed -> ERROR
        context = {"records_total": 1000, "records_indexed": 0}
        with self.assertRaises(ValueError):
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
        self.assertEqual(p, 10)

        # Processing 50% (500/1000) -> Mapped to range 20-60 -> should be 40%
        context = {"records_processed": 500, "records_total": 1000}
        p = ETLStateMachine.get_progress(ETLState.PROCESSING, context)
        # 20 + (0.5 * 40) = 40
        self.assertEqual(p, 40)

        # Processing 100% (1000/1000) -> 60%
        context = {"records_processed": 1000, "records_total": 1000}
        p = ETLStateMachine.get_progress(ETLState.PROCESSING, context)
        self.assertEqual(p, 60)

        # Indexing 50% (500/1000) -> Range 60-90 -> 75%
        context = {"records_indexed": 500, "records_total": 1000}
        p = ETLStateMachine.get_progress(ETLState.INDEXING, context)
        # 60 + (0.5 * 30) = 75
        self.assertEqual(p, 75)

if __name__ == '__main__':
    unittest.main()
