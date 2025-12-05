"""ETL Schemas"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ETLJobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ETLJobCreate(BaseModel):
    pipeline: str
    source: str
    config: dict = {}


class ETLJobResponse(BaseModel):
    id: str
    pipeline: str
    status: ETLJobStatus
    records_total: int = 0
    records_processed: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
