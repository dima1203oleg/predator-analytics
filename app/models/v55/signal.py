"""Predator v55.0 — Signal Pydantic Models."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class SignalResponse(BaseModel):
    """A signal emitted by the analytical engines."""

    signal_id: str
    signal_type: str = Field(description="anomaly | alert | warning | info | prediction | pattern")
    signal_type_ua: str = Field(description="Тип сигналу українською")
    topic: str
    ueid: str | None = None
    layer: str = Field(description="behavioral | institutional | influence | structural | predictive")
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
