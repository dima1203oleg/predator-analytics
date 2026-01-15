#!/usr/bin/env python3.12
"""
🤖 Predator v26.2 - Autonomous Task Processor (God Mode)
---------------------------------------------------------
Reads EXECUTION_TODO.md and executes tasks using the Sovereign Orchestrator.
System operates with FULL AUTONOMY.
"""

import asyncio
import os
import re
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from services.orchestrator.agents.v25_sovereign_registry import sovereign_orchestrator
from libs.core.structured_logger import get_logger

logger = get_logger("predator.autonomous_processor")

TODO_FILE = PROJECT_ROOT / "EXECUTION_TODO.md"

async def process_todos():
    if not TODO_FILE.exists():
        logger.error(f"TODO file not found at {TODO_FILE}")
        return

    content = TODO_FILE.read_text(encoding="utf-8")

    # Simple regex to find tasks that are not checked (e.g. - [ ])
    # We look for tasks in P0 and P1 primarily
    pattern = r"### (\d+)\) (.*?)\n(.*?)(?=\n###|\n##|$)"
    matches = re.finditer(pattern, content, re.DOTALL)

    tasks_processed = 0

    for match in matches:
        task_num = match.group(1)
        task_title = match.group(2)
        task_details = match.group(3).strip()

        # Check if already completed (simple check: if it's already marked in the text somehow,
        # but EXECUTION_TODO.md doesn't use [x] yet. Let's look at the content again.)

        full_task_desc = f"TASK {task_num}: {task_title}\nDETAILS:\n{task_details}"

        logger.info(f"🚀 Processing Task {task_num}: {task_title}")

        try:
            # Execute via Sovereign Orchestrator
            result = await sovereign_orchestrator.execute_comprehensive_cycle(full_task_desc)

            if result.get("status") == "success":
                logger.info(f"✅ Task {task_num} completed successfully!")
                tasks_processed += 1
                # Mark as completed in the file (optional, but good for tracking)
                # For now, we trust the agent's internal state and git commits.
            else:
                logger.warning(f"⚠️ Task {task_num} failed: {result.get('message')}")

        except Exception as e:
            logger.error(f"❌ Error processing task {task_num}: {e}")
            # Continue to next task in God Mode
            continue

    logger.info(f"🏁 Autonomous processing finished. Tasks handled: {tasks_processed}")

if __name__ == "__main__":
    # Ensure SOVEREIGN_AUTO_APPROVE is set for this process
    os.environ["SOVEREIGN_AUTO_APPROVE"] = "true"
    asyncio.run(process_todos())
