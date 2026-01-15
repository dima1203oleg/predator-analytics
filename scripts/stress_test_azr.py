import asyncio
import json
import logging
from pathlib import Path
from app.services.azr_engine import azr_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AZR_STRESS_TEST")

async def run_stress_test():
    logger.info("🔥 Starting AZR Engine Stress Test...")

    # 1. Simulate 5 cycles
    for i in range(1, 6):
        logger.info(f"📍 Cycle {i} simulation...")
        await azr_engine._run_cycle()

        # Check audit log size
        if azr_engine.audit_log_path.exists():
            with open(azr_engine.audit_log_path) as f:
                logs = f.readlines()
                logger.info(f"📊 Audit Log Entries: {len(logs)}")

        # Let it breath
        await asyncio.sleep(2)

    # 2. Verify Immunity
    logger.info(f"🧬 Immunity Store Size: {len(azr_engine.immunity.fingerprints)}")

    # 3. Final Status
    status = azr_engine.get_status()
    logger.info(f"🏆 Final Status: {json.dumps(status, indent=2)}")

if __name__ == "__main__":
    asyncio.run(run_stress_test())
