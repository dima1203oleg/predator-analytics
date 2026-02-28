"""Predator v55.0 — CERS Pydantic Models."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class CERSResponse(BaseModel):
    """CERS score response for an entity."""

    ueid: str
    score: float = Field(ge=0, le=100, description="CERS score (0-100)")
    level: str = Field(description="stable | watchlist | elevated | high_alert | critical")
    level_ua: str = Field(description="Рівень ризику українською")
    level_en: str = Field(description="Risk level in English")
    components: dict[str, float] = Field(description="Score per analytical layer")
    weights: dict[str, float] = Field(description="Weights used for each layer")
    confidence: float = Field(ge=0, le=1, description="Confidence score")
    decorrelation_applied: bool = False
    calculated_at: Optional[datetime] = None


class CERSHistoryItem(BaseModel):
    """Historical CERS entry."""

    score: float
    level: str
    level_ua: str
    calculated_at: datetime


class CERSHistoryResponse(BaseModel):
    """CERS history for an entity."""

    ueid: str
    history: list[CERSHistoryItem]
    trend: str = Field(description="improving | stable | worsening")
    trend_ua: str = Field(description="Тренд українською")
