from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class DatasetType(str, Enum):
    CUSTOMS = "customs"
    COMPANIES = "companies"
    PERSONS = "persons"
    TRANSACTIONS = "transactions"
    MEDIA = "media"
    CUSTOM = "custom"

class DatasetStatus(str, Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    READY = "ready"
    ACTIVE = "active"
    ARCHIVED = "archived"

class Dataset(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    type: DatasetType
    owner_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    status: DatasetStatus = DatasetStatus.DRAFT
    records_count: int = 0
    file_size_bytes: int = 0

    is_active: bool = False
    is_training_source: bool = False
    is_generation_template: bool = False

    schema_definition: Optional[Dict[str, Any]] = Field(None, alias="schema")
    sample_records: Optional[List[Dict[str, Any]]] = None

class DatasetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    type: DatasetType
    is_training_source: bool = False
    is_generation_template: bool = False
