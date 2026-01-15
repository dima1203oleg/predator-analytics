#!/usr/bin/env python3
"""
Chaos Scenario: Fake Progress Injection (INV-002 Violation)
Injects a "COMPLETED" state transition with zero indexed records,
verifying that the Arbiter detects the lie, blocks the transition,
and raises an invariant violation.
"""
import asyncio
import json
import os
import sys
from datetime import datetime
from uuid import uuid4

# Ensure project root is in path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services/api-gateway"))

from libs.core.database import get_db_ctx
from libs.core.etl_state_machine import ETLState
from app.services.state_derivation import StateDerivationEngine

async def run_scenario():
    print("🧪 [CHAOS] Starting Scenario: Fake Progress Injection (INV-002/INV-001)...")
    print("⚠️  Running in LOGIC VERIFICATION MODE (No Database Connection)")

    # 1. Setup: Define a Job context (Virtual)
    job_id = str(uuid4())
    print(f"👉 Testing virtual job {job_id}...")

    # Virtual initial state
    current_state = ETLState.PROCESSING
    current_metrics = {
        "records_total": 1000,
        "records_processed": 500,
        "records_indexed": 0 # Not done!
    }

    # 2. Action: Inject a fake COMPLETED fact/transition report
    # The "Attacker" (buggy code) tries to claim it finished.
    # We simulate this by passing facts to the Derivation Engine that imply "I am done"
    # but the metrics (evidence) show otherwise.

    print("⚡️ Injecting FAKE 'COMPLETED' claim...")

    engine = StateDerivationEngine()

    # Fake facts: "I processed everything!" but distinct index count is 0
    fake_facts = [
        {"fact_type": "metric", "timestamp": datetime.utcnow().isoformat(), "payload": {"records_processed": 1000, "records_indexed": 0}},
        {"fact_type": "status_claim", "timestamp": datetime.utcnow().isoformat(), "payload": {"claimed_state": "COMPLETED"}}
    ]

    # Previous state was PROCESSING
    derivation = engine.derive_state(fake_facts, current_state)

    print("\n🔍 Arbiter Derivation Result:")
    print(json.dumps(derivation, indent=2))

    # 3. Verification
    print("\n⚖️  Verifying Arbiter Judgment...")

    passed = True

    # Expectation 1: Derived state is NOT COMPLETED (should likely be PROCESSING or INDEXING)
    if derivation["state"] == ETLState.COMPLETED.value or derivation["state"] == ETLState.COMPLETED:
        print("❌ FAIL: Arbiter accepted COMPLETED state despite 0 indexed records.")
        passed = False
    else:
        print(f"✅ PASS: Arbiter rejected COMPLETED. Derived: {derivation['state']}")

    # Expectation 2: Check Confidence Score
    if derivation["confidence"] >= 1.0:
         print(f"❌ FAIL: Confidence is {derivation['confidence']} (Too high for conflicting data).")
         passed = False
    else:
        print(f"✅ PASS: Confidence penalized: {derivation['confidence']}")

    if passed:
        print("\n🏆 CHAOS SCENARIO PASSED: Axioms Hold.")
        sys.exit(0)
    else:
        print("\n💀 CHAOS SCENARIO FAILED: Truth Violated.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_scenario())
