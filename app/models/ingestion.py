from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class IngestionStatus(str, Enum):
    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    VALIDATING = "validating"
    PARSING = "parsing"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    INDEXING = "indexing"
    READY = "ready"
    FAILED = "failed"

class IngestionProgress(BaseModel):
    stage: str
    percent: float = 0
    current_item: int = 0
    total_items: int = 0
    message: str = ""

class IngestionJob(BaseModel):
    id: str
    filename: str
    file_size: int
    file_type: str
    status: IngestionStatus
    user_id: str
    created_at: datetime
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    progress: IngestionProgress
    chunks_total: Optional[int] = None
    chunks_received: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ChunkUploadRequest(BaseModel):
    filename: str
    total_size: int
    total_chunks: int
    file_type: str
    chunk_size: int = 5 * 1024 * 1024  # 5MB default

class IngestionResponse(BaseModel):
    job_id: str
    status: IngestionStatus
    message: str
    status_url: str
    stream_url: str
