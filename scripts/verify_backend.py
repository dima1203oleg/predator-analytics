from __future__ import annotations

import asyncio
import sys
from unittest.mock import MagicMock


# Define paths
sys.path.append('/home/dima/Predator_21/backend/orchestrator/agents')

# Mock aiogram heavily to prevent ImportErrors or instantiation issues during import
sys.modules['aiogram'] = MagicMock()
sys.modules['aiogram.types'] = MagicMock()
sys.modules['aiogram.filters'] = MagicMock()
sys.modules['aiogram.fsm'] = MagicMock()
sys.modules['aiogram.fsm.context'] = MagicMock()
sys.modules['aiogram.fsm.state'] = MagicMock()
sys.modules['aiogram.fsm.storage.redis'] = MagicMock()

# Now import the actual logic classes
# We can't import the module directly because it might have global `bot = Bot(...)` calls which would fail with mocks or missing tokens
# So we will parse the file and extract the classes dynamically or just copy-paste the Controller logic for verification.
# Actually, let's try to import. If the bot global var init fails, we'll see.
# telegram_bot_v4_advanced.py has `bot = Bot(token=TELEGRAM_TOKEN)` inside `main()`? No, it's global?
# Let's check the file content again via `cat` or memory.
# Looking at previous view_file:
# `bot = Bot(token=TELEGRAM_TOKEN)` is inside `mock_main` or `main`?
# Line 1323: `bot = Bot(token=TELEGRAM_TOKEN)` is inside `async def main():`.
# So global scope is safe!

try:
    from telegram_bot_v4_advanced import AgentController, DockerController, GitController, SystemController
    print("✅ Module imported successfully.")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    # If import fails, we might need to set env vars

async def test_functions():
    print("\n--- Testing SystemController ---")
    try:
        res = await SystemController.get_system_status()
        print("✅ get_system_status: Success")
        print(f"   Output preview: {res.splitlines()[1] if len(res.splitlines()) > 1 else res[:50]}")
    except Exception as e:
        print(f"❌ get_system_status: Failed ({e})")

    try:
        res = await SystemController.get_processes()
        print("✅ get_processes: Success")
    except Exception as e:
        print(f"❌ get_processes: Failed ({e})")

    print("\n--- Testing DockerController ---")
    try:
        res = await DockerController.get_containers()
        print("✅ get_containers: Success")
    except Exception as e:
        print(f"❌ get_containers: Failed ({e})")

    print("\n--- Testing AgentController ---")
    try:
        res = await AgentController.get_available_agents()
        print("✅ get_available_agents: Success")
        print(f"   Agents found: {res}")
    except Exception as e:
        print(f"❌ get_available_agents: Failed ({e})")

    print("\n--- Testing GitController ---")
    try:
        res = await GitController.get_status()
        print("✅ get_status: Success")
    except Exception as e:
        print(f"❌ get_status: Failed ({e})")

if __name__ == "__main__":
    try:
        asyncio.run(test_functions())
    except Exception as e:
        print(f"Test runner error: {e}")
