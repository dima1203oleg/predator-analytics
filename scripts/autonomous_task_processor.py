from __future__ import annotations

import asyncio
import contextlib

# Adjust path to find app modules
import os
import sys

from dotenv import load_dotenv

# Load env variables from root .env
load_dotenv()

sys.path.append(os.getcwd()) # Add root for libs
sys.path.append(os.path.join(os.getcwd(), "services/api_gateway")) # Add api-gateway

# Mock libs if running standalone without full env
try:
    from app.services.evolution_service import evolution_service
    from app.services.mission_discoverer import mission_discoverer
    from app.services.self_healer import self_healer
except ImportError:
    # Fallback/Mock logic could go here if needed
    sys.exit(1)

async def run_autonomous_cycle():

    # 1. Discover Missions
    missions = await mission_discoverer.discover_missions()

    # 2. Process Missions (Task Processor Logic)
    executed_count = 0
    for mission in missions:
        # Simple policy: only process 'high' priority or first 3
        if mission['priority'] == 'high':
            success = await self_healer.heal(mission)
            if success:
                executed_count += 1


    # 3. Evolution Tracking
    await evolution_service.save_snapshot()

    # 4. Summary

async def main_loop():
    while True:
        with contextlib.suppress(Exception):
            await run_autonomous_cycle()

        # In real production, this might be 1 hour (3600).
        # For demo/active monitoring: 60 seconds (prev 30)
        await asyncio.sleep(60)

if __name__ == "__main__":
    t = asyncio.run(main_loop())
