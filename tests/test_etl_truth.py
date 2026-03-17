from __future__ import annotations

import asyncio
import sys
sys.path.append('/Users/dima-mac/Documents/Predator_21')
from datetime import datetime, timedelta
import os
from typing import Any, Dict
import unittest
import sys
sys.path.append('/Users/dima-mac/Documents/Predator_21')
sys.path.append('/Users/dima-mac/Documents/Predator_21')
sys.path.append('/Users/dima-mac/Documents/Predator_21')
sys.path.append('/Users/dima-mac/Documents/Predator_21')
sys.path.append('/Users/dima-mac/Documents/Predator_21')

# Add api-gateway root to find 'app'
sys.path.append(os.path.join(os.getcwd(), "services/api_gateway"))

import pytest

from services.etl_arbiter import ETLArbiter  
from libs.core.etl_state_machine import ETLState, ETLStateMachine


class TestETLTruthfulness(unittest.TestCase):
    def test_state_transitions(self):
        """Verify strict state machine transitions."""
        # Valid
        assert ETLStateMachine.can_transition(ETLState.CREATED, ETLState.SOURCE_CHECKED)
        assert ETLStateMachine.can_transition(ETLState.INGESTED, ETLState.PARSED)

        # Invalid (Skipping steps)
        assert not ETLStateMachine.can_transition(ETLState.CREATED, ETLState.PARSED)
        assert not ETLStateMachine.can_transition(ETLState.PARSED, ETLState.LOADED)

    def test_progress_calculation(self):
        """Verify deterministic progress calculation."""
        # Created = 0%
        p = ETLStateMachine.get_progress(ETLState.CREATED, {})
        assert p == 0
        
        # Source Checked = 9%
        p = ETLStateMachine.get_progress(ETLState.SOURCE_CHECKED, {})
        assert p == 9

        # Parsed base is 27%. With 50% records (500/1000) sub-progress is (0.5 * 8) = 4
        # So 27 + 4 = 31
        context = {"records_processed": 500, "records_total": 1000}
        p = ETLStateMachine.get_progress(ETLState.PARSED, context)
        assert p == 31

        # Vectorized base is 90%. With 50% records (500/1000) sub-progress is (0.5 * 8) = 4
        # So 90 + 4 = 94
        context = {"records_indexed": 500, "records_total": 1000}
        p = ETLStateMachine.get_progress(ETLState.VECTORIZED, context)
        assert p == 94


if __name__ == "__main__":
    unittest.main()
