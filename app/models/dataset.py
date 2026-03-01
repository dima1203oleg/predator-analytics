from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class DatasetType(StrEnum):
    CUSTOMS = "customs"
    COMPANIES = "companies"
    PERSONS = "persons"
    TRANSACTIONS = "transactions"
    MEDIA = "media"
    CUSTOM = "custom"


class DatasetStatus(StrEnum):
    DRAFT = "draft"
    PROCESSING = "processing"
    READY = "ready"
    ACTIVE = "active"
    ARCHIVED = "archived"


class Dataset(BaseModel):
    id: str
    name: str
    description: str | None = None
    type: DatasetType
    owner_id: str
    created_at: datetime
    updated_at: datetime | None = None

    status: DatasetStatus = DatasetStatus.DRAFT
    records_count: int = 0
    file_size_bytes: int = 0

    is_active: bool = False
    is_training_source: bool = False
    is_generation_template: bool = False

    schema_definition: dict[str, Any] | None = Field(None, alias="schema")
    sample_records: list[dict[str, Any]] | None = None


class DatasetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    type: DatasetType
    is_training_source: bool = False
    is_generation_template: bool = False
