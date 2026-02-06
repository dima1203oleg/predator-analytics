from __future__ import annotations

import asyncio
from datetime import datetime
import sys
import uuid


# Set up PYTHONPATH for libs
sys.path.append("/app")

from libs.core.database import async_session_maker
from libs.core.models import TrinityAuditLog


async def create_dummy_log():
    async with async_session_maker() as session:
        log = TrinityAuditLog(
            id=uuid.uuid4(),
            request_text="System status check [AUTO-GEN]",
            user_id="admin",
            intent="info",
            gemini_plan={"steps": ["check_health", "report"], "intent": "info"},
            mistral_output="System is operational. All nodes ACTIVE.",
            copilot_audit={"passed": True, "errors": []},
            status="verified",
            final_output="🔍 System Intelligence Report\nAnalyzed query: status check. Cluster status: ACTIVE.",
            risk_level="low",
            execution_time_ms=125,
            created_at=datetime.utcnow()
        )
        session.add(log)
        await session.commit()
        print(f"Created dummy log with ID: {log.id}")

if __name__ == "__main__":
    asyncio.run(create_dummy_log())
