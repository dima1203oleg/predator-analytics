from __future__ import annotations

from typing import Any

from app.libs.core.structured_logger import get_logger
from app.services.code_quality_analyzer import code_quality_analyzer


logger = get_logger("service.mission_discoverer")


class MissionDiscoverer:
    """Analyzes system state and analytics to generate actionable missions (tasks).
    Bridge between Analysis (Passive) and Execution (Active).
    """

    async def discover_missions(self) -> list[dict[str, Any]]:
        missions = []

        # 1. Code Quality Missions
        logger.info("scanning_for_code_quality_missions")
        improvements = await code_quality_analyzer.generate_improvements()
        for imp in improvements:
            missions.append(
                {
                    "type": "code_improvement",
                    "source": "CodeQualityAnalyzer",
                    "priority": imp["priority"],
                    "payload": imp,
                    "status": "pending_execution",
                }
            )

        # 2. Anomaly Missions (Future: from AnomalyService)
        # 3. Security Missions (Future: from SOM)

        logger.info("missions_discovered", count=len(missions))
        return missions


mission_discoverer = MissionDiscoverer()
