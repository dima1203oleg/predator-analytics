"""Portal Schemas"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PortalStatus(BaseModel):
    status: str
    version: str
    uptime: str
    last_sync: datetime


class PublicQuery(BaseModel):
    query: str
    sector: Optional[str] = "GOV"
    limit: int = 10


class PublicSearchResult(BaseModel):
    query: str
    results: List[dict]
    total: int
    timestamp: datetime
