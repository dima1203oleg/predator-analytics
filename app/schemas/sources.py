from __future__ import annotations

"""Data Source Schemas."""
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID


class DataSourceBase(BaseModel):
    name: str
    source_type: str  # file, api, telegram, registry
    connector: str  # upload, api, bot, scraper
    sector: str | None = None
    config: dict[str, Any] = {}
    schedule: dict[str, Any] | None = None


class DataSourceCreate(DataSourceBase):
    pass


class DataSourceUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    sector: str | None = None
    config: dict[str, Any] | None = None
    schedule: dict[str, Any] | None = None


class DataSource(DataSourceBase):
    id: UUID
    status: str
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SourceStatusUpdate(BaseModel):
    status: str
    message: str | None = None
