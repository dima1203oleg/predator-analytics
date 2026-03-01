from __future__ import annotations


"""Portal Schemas."""
from datetime import datetime

from pydantic import BaseModel


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
