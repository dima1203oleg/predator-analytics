"""Data Source Schemas"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class DataSourceBase(BaseModel):
    name: str
    source_type: str # file, api, telegram, registry
    connector: str   # upload, api, bot, scraper
    sector: Optional[str] = None
    config: Dict[str, Any] = {}
    schedule: Optional[Dict[str, Any]] = None


class DataSourceCreate(DataSourceBase):
    pass


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    sector: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    schedule: Optional[Dict[str, Any]] = None


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
    message: Optional[str] = None
