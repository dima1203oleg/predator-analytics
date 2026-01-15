
import asyncio
import os
import sys
import json
from datetime import datetime

# Add project root
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services/api-gateway"))

from services.orchestrator.council.mission_planner import get_mission_planner, MissionPriority
from libs.core.structured_logger import setup_structured_logging

# Configure logging to stdout
setup_structured_logging(log_level="INFO", use_json=True)

async def verify_mission_planner():
    print("--- 🎯 Testing Mission Planner OODA Loop ---")

    planner = get_mission_planner()

    # 1. Create Mission
    mission = await planner.create_mission(
        title="Verify Security Protocols",
        description="Scan system for vulnerabilities and check compliance protocols.",
        priority=MissionPriority.HIGH,
        context={"deadline": "2026-01-20T12:00:00Z"}
    )

    print(f"✅ Mission Created: {mission.mission_id}")

    # 2. Plan Mission
    mission = await planner.plan_mission(mission)
    print(f"✅ Mission Planned with {len(mission.tasks)} tasks")
    for task in mission.tasks:
        print(f"   - [{task.task_id}] {task.description} -> {task.assigned_agent}")

    print("\n📊 OODA Metrics (Planning):")
    print(json.dumps(mission.ooda_metrics, indent=2))

    # 3. Execute Mission
    print("\n▶️ Executing Mission...")
    mission = await planner.execute_mission(mission)

    print(f"✅ Mission Status: {mission.status.value}")
    print(f"   Result: {json.dumps(mission.result, indent=2)}")

    print("\n📊 Final OODA Metrics:")
    print(json.dumps(mission.ooda_metrics, indent=2))

if __name__ == "__main__":
    asyncio.run(verify_mission_planner())
