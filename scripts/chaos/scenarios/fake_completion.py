from __future__ import annotations

# scripts/chaos/scenarios/fake_completion.py
import asyncio
import logging
import uuid

from libs.core.database import get_db_ctx
from libs.core.etl_state_machine import ETLState
from libs.core.models.entities import ETLJob

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ChaosFakeCompletion")

async def run_scenario():
    """Scenario: Fake Completion
    A job is manually set to COMPLETED/INDEXED but has ZERO indexed records in its facts.
    The Arbiter should detect this and force-fail the job.
    """
    logger.info("🧪 Starting Chaos Scenario: Fake Completion...")

    async with get_db_ctx() as sess:
        # 1. Create a dummy job
        job_id = uuid.uuid4()
        job = ETLJob(
            id=job_id,
            source_file="chaos_test.xlsx",
            state=ETLState.PROCESSING.value,
            progress={"records_total": 100, "records_processed": 100, "records_indexed": 0}
        )
        sess.add(job)
        await sess.commit()
        logger.info(f"✅ Created Dummy Job: {job_id}")

        # 2. Simulate "Fake Completion" (Engine bypass)
        # We manually set state to INDEXED but leave records_indexed at 0.
        job.state = ETLState.INDEXED.value
        await sess.commit()
        logger.info(f"😈 Manually set Job {job_id} to INDEXED (Invariant Violation: 0 records).")

    # 3. Wait for Arbiter to catch it
    logger.info("⏳ Waiting for Arbiter Agent derivation cycle...")

    # In a real test we'd wait, but here we can just check if Arbiter Fail is applied
    # By running the arbiter logic once if we could, or just waiting.
    # For CI/CD we would use a timeout.

    logger.info(f"🔍 To verify, run: predatorctl etl audit {job_id}")
    logger.info("⚖️ Arbiter should detect INV-004 and force-fail.")

if __name__ == "__main__":
    asyncio.run(run_scenario())
