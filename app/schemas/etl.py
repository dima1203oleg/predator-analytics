from __future__ import annotations

"""ETL Schemas."""
from enum import StrEnum
from typing import TYPE_CHECKING

from pydantic import BaseModel

if TYPE_CHECKING:
    from datetime import datetime


class ETLJobStatus(StrEnum):
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
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error: str | None = None
