from __future__ import annotations

import asyncio
import sys


# Add project root to sys.path
sys.path.append('/app')

from app.services.detection_service import detection_service


async def test():
    print("Testing Detection Engine...")
    cases = await detection_service.run_detection_cycle(limit=100)
    print(f"Detection cycle completed. Cases created: {cases}")

if __name__ == "__main__":
    asyncio.run(test())
