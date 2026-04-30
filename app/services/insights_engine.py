from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from datetime import datetime


class InsightType(StrEnum):
    PREDICTION = "prediction"
    ANOMALY = "anomaly"
    OPPORTUNITY = "opportunity"
    RISK = "risk"
    RECOMMENDATION = "recommendation"


class InsightPriority(StrEnum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class AIInsight:
    id: str
    type: InsightType
    priority: InsightPriority
    title: str
    description: str
    confidence: float
    impact: str
    category: str
    created_at: datetime
    actionable: bool
    actions: list[dict] | None = None
    saved: bool = False


from app.services.ml.insights_service import AIInsight as MLInsight
from app.services.ml.insights_service import get_insights_service


class InsightsEngine:
    """Engine for generating automatic AI insights and anomaly detection."""

    def __init__(self):
        self.logger = logging.getLogger("predator.insights")
        self._service = get_insights_service()

    async def get_latest_insights(self) -> list[MLInsight]:
        """Fetch latest findings from analytical models."""
        # Delegating to the new canonical ML service
        return await self._service.generate_market_insights()

insights_engine = InsightsEngine()
