from __future__ import annotations

#!/usr/bin/env python3
"""Chaos Scenario: Fake Progress Injection (INV-002 Violation)
Injects a "COMPLETED" state transition with zero indexed records,
verifying that the Arbiter detects the lie, blocks the transition,
and raises an invariant violation.
"""
import asyncio
from datetime import datetime
import os
import sys
from uuid import uuid4

# Ensure project root is in path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services/api_gateway"))

from app.services.state_derivation import StateDerivationEngine
from libs.core.etl_state_machine import ETLState


async def run_scenario():

    # 1. Setup: Define a Job context (Virtual)
    str(uuid4())

    # Virtual initial state
    current_state = ETLState.PROCESSING

    # 2. Action: Inject a fake COMPLETED fact/transition report
    # The "Attacker" (buggy code) tries to claim it finished.
    # We simulate this by passing facts to the Derivation Engine that imply "I am done"
    # but the metrics (evidence) show otherwise.


    engine = StateDerivationEngine()

    # Fake facts: "I processed everything!" but distinct index count is 0
    fake_facts = [
        {"fact_type": "metric", "timestamp": datetime.utcnow().isoformat(), "payload": {"records_processed": 1000, "records_indexed": 0}},
        {"fact_type": "status_claim", "timestamp": datetime.utcnow().isoformat(), "payload": {"claimed_state": "COMPLETED"}}
    ]

    # Previous state was PROCESSING
    derivation = engine.derive_state(fake_facts, current_state)


    # 3. Verification

    passed = True

    # Expectation 1: Derived state is NOT COMPLETED (should likely be PROCESSING or INDEXING)
    if derivation["state"] == ETLState.COMPLETED.value or derivation["state"] == ETLState.COMPLETED:
        passed = False
    else:
        pass

    # Expectation 2: Check Confidence Score
    if derivation["confidence"] >= 1.0:
         passed = False
    else:
        pass

    if passed:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_scenario())
