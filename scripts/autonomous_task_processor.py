from __future__ import annotations

import asyncio
from datetime import datetime

# Adjust path to find app modules
import os
import sys
import time

from dotenv import load_dotenv


# Load env variables from root .env
load_dotenv()

sys.path.append(os.getcwd()) # Add root for libs
sys.path.append(os.path.join(os.getcwd(), "services/api-gateway")) # Add api-gateway

# Mock libs if running standalone without full env
try:
    from app.services.evolution_service import evolution_service
    from app.services.mission_discoverer import mission_discoverer
    from app.services.self_healer import self_healer
except ImportError as e:
    print(f"Import Error: {e}")
    # Fallback/Mock logic could go here if needed
    sys.exit(1)

async def run_autonomous_cycle():
    print(f"[{datetime.now()}] 🔄 Starting Autonomous Self-Improvement Cycle...")

    # 1. Discover Missions
    print(" [1/4] Discovery Phase...")
    missions = await mission_discoverer.discover_missions()
    print(f"       Found {len(missions)} missions.")

    # 2. Process Missions (Task Processor Logic)
    print(" [2/4] Processing Phase...")
    executed_count = 0
    for mission in missions:
        # Simple policy: only process 'high' priority or first 3
        if mission['priority'] == 'high':
            print(f"       ⚡ Executing: {mission['payload']['title']}")
            success = await self_healer.heal(mission)
            if success:
                executed_count += 1

    print(f"       Executed {executed_count} missions.")

    # 3. Evolution Tracking
    print(" [3/4] Evolution Tracking...")
    await evolution_service.save_snapshot()

    # 4. Summary
    print(" [4/4] Cycle Complete. Sleeping...")
    print(f"[{datetime.now()}] ✅ Cycle Finished.\n")

async def main_loop():
    print("🚀 PREDATOR AUTONOMOUS TASK PROCESSOR ACTIVATED")
    print("===============================================")
    while True:
        try:
            await run_autonomous_cycle()
        except Exception as e:
            print(f"❌ Cycle Error: {e}")

        # In real production, this might be 1 hour (3600).
        # For demo/active monitoring: 60 seconds (prev 30)
        await asyncio.sleep(60)

if __name__ == "__main__":
    t = asyncio.run(main_loop())
