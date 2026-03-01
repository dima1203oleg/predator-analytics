from datetime import UTC, datetime
import logging
from typing import Any


logger = logging.getLogger("app.services.system_status_service")


class SystemStatusService:
    async def get_system_stats(self) -> dict[str, Any]:
        return {"uptime": "99.9%", "active_agents": 25, "tasks_completed": 150}

    async def get_comprehensive_status(self) -> dict[str, Any]:
        # Mock status for UI compatibility
        return {
            "status": "HEALTHY",
            "health_score": 98.5,
            "active_queues": 0,
            "data_pipeline": {
                "opensearch": {"status": "healthy", "docs_count": 125432},
                "qdrant": {"status": "healthy", "vectors_count": 125432},
                "postgres": {"status": "healthy"},
                "redis": {"status": "healthy"},
            },
            "is_lockdown": False,
            "advisor_note": "Система працює стабільно. Пропускна здатність каналів обробки даних у межах норми.",
            "timestamp": datetime.now(UTC).isoformat(),
        }


system_status_service = SystemStatusService()
