
import asyncio
import os
import sys
import json
from pathlib import Path

# Add project root and api-gateway
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services/api-gateway"))

from services.orchestrator.agents.v25_sovereign_registry import sovereign_orchestrator
from libs.core.structured_logger import get_logger

async def test_auto_learning():
    print("--- 🧠 Testing Auto-Learning Storage ---")

    # Patch workspace root for local execution
    sovereign_orchestrator.workspace_root = Path(os.getcwd())
    print(f"🔧 Workspace patched to: {sovereign_orchestrator.workspace_root}")

    task_desc = "Test auto-learning mechanism"
    result = {"status": "success", "message": "Test successful"}

    # Manually invoke the learning update
    await sovereign_orchestrator._update_local_knowledge(task_desc, result)

    # Check if file exists
    log_file = Path("data/training/experience_log.jsonl")
    if log_file.exists():
        print(f"✅ Experience log created at {log_file}")
        with open(log_file, 'r') as f:
            lines = f.readlines()
            last_entry = json.loads(lines[-1])
            print("📝 Last Entry Content:")
            print(json.dumps(last_entry, indent=2, ensure_ascii=False))

            if last_entry.get("task") == task_desc:
                 print("✅ Auto-learning storage validated.")
            else:
                 print("❌ Entry mismatch.")
    else:
        print("❌ Experience log file not found.")

if __name__ == "__main__":
    asyncio.run(test_auto_learning())
