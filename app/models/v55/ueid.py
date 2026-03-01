"""Predator v55.0 — UEID Pydantic Models."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class EntityCreate(BaseModel):
    """Request to create or resolve an entity."""

    name: str = Field(min_length=1, max_length=500, description="Назва суб'єкта")
    entity_type: str = Field(description="company | person | broker | customs_post")
    edrpou: str | None = Field(None, pattern=r"^\d{8,10}$", description="ЄДРПОУ (8-10 цифр)")
    inn: str | None = Field(None, max_length=12, description="ІПН")
    metadata: dict[str, Any] = Field(default_factory=dict)


class EntityResponse(BaseModel):
    """Response with entity data."""

    ueid: str = Field(description="Universal Economic ID")
    entity_type: str
    name: str
    name_normalized: str
    edrpou: str | None = None
    inn: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    is_new: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None


class EntitySearchRequest(BaseModel):
    """Search request for entities."""

    query: str = Field(min_length=1, description="Пошуковий запит (назва або ЄДРПОУ)")
    entity_type: str | None = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class EntitySearchResponse(BaseModel):
    """Search response with matched entities."""

    total: int
    items: list[EntityResponse]
    query: str
