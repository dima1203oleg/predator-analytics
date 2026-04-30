"""Predator v55.0 — Signal Pydantic Models."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from datetime import datetime


class SignalResponse(BaseModel):
    """A signal emitted by the analytical engines."""

    signal_id: str
    signal_type: str = Field(description="anomaly | alert | warning | info | prediction | pattern")
    signal_type_ua: str = Field(description="Тип сигналу українською")
    topic: str
    ueid: str | None = None
    layer: str = Field(
        description="behavioral | institutional | influence | structural | predictive"
    )
    layer_ua: str = Field(description="Назва шару українською")
    score: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)
    summary: str = Field(description="Короткий опис сигналу українською")
    details: dict[str, Any] = Field(default_factory=dict)
    sources: list[str] = Field(default_factory=list)
    created_at: datetime


class SignalListResponse(BaseModel):
    """List of signals with pagination."""

    total: int
    items: list[SignalResponse]
    page: int
    page_size: int


# ─── v55 Internal Models for Engines ───

from enum import StrEnum


class SignalLayer(StrEnum):
    BEHAVIORAL = "behavioral"
    INSTITUTIONAL = "institutional"
    INFLUENCE = "influence"
    STRUCTURAL = "structural"
    PREDICTIVE = "predictive"
    META = "meta"

class SignalPriority(StrEnum):
    ROUTINE = "routine"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class V55Signal(BaseModel):
    """Internal signal model used by analytical engines."""

    signal_type: str
    topic: str
    ueid: str
    layer: SignalLayer
    priority: SignalPriority = SignalPriority.ROUTINE
    score: float = 0.0
    confidence: float = 1.0
    summary: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    sources: list[str] = Field(default_factory=list)
