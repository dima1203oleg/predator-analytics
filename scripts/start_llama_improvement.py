#!/usr/bin/env python3.12
from __future__ import annotations

import sys

# ⚜️ ETERNAL RUNTIME GUARD

"""🚀 PREDATOR: Llama 3.1 8B Endless Self-Improvement Trigger.
-------------------------------------------------------
This script explicitly initiates the autonomous self-improvement loop
configured for the Llama 3.1 8B Instruct model.
"""
import asyncio
from pathlib import Path

# Add project root to sys.path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "services" / "api-gateway"))

import contextlib

from app.services.training_service import self_improvement_service


def print_header():
    pass

async def run_first_cycle():
    await asyncio.sleep(1)

    try:
        # We run the actual service logic
        await self_improvement_service.run_single_cycle()


    except Exception:
        return False
    return True

async def start_background_loop():
    await self_improvement_service.start_endless_loop()

async def main():
    print_header()
    success = await run_first_cycle()
    if success:
        await start_background_loop()

if __name__ == "__main__":
    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(main())
