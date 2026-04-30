from __future__ import annotations

"""Portal Schemas."""

from typing import TYPE_CHECKING

from pydantic import BaseModel

if TYPE_CHECKING:
    from datetime import datetime


class PortalStatus(BaseModel):
    status: str
    version: str
    uptime: str
    last_sync: datetime


class PublicQuery(BaseModel):
    query: str
    sector: str | None = "GOV"
    limit: int = 10


class PublicSearchResult(BaseModel):
    query: str
    results: list[dict]
    total: int
    timestamp: datetime
