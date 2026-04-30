import logging
from typing import Any

logger = logging.getLogger("app.services.recommendation_service")


class RecommendationService:
    async def get_system_recommendations(self) -> list[Any]:
        return [
            {"id": 1, "text": "Optimize database indexes", "priority": "high"},
            {"id": 2, "text": "Enable deep caching", "priority": "medium"},
        ]


recommendation_service = RecommendationService()
