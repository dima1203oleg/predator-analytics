from __future__ import annotations


"""Predator Analytics v45 - Canonical Entities
Source, Dataset, Job, Index, Artifact definitions.
"""
from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship


Base = declarative_base()

# ============================================================================
# ENUMS
# ============================================================================


class SourceType(StrEnum):
    FILE = "file"
    API = "api"
    DATABASE = "database"
    STREAM = "stream"
    WEBHOOK = "webhook"


class DatasetStatus(StrEnum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"


class JobType(StrEnum):
    INGESTION = "ingestion"
    ETL = "etl"
    INDEXING = "indexing"
    TRAINING = "training"
    SYNTHETIC = "synthetic"
    OPTIMIZATION = "optimization"


class JobStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class IndexType(StrEnum):
    OPENSEARCH = "opensearch"
    QDRANT = "qdrant"
    HYBRID = "hybrid"


class ArtifactType(StrEnum):
    MODEL = "model"
    DATASET = "dataset"
    LOG = "log"
    REPORT = "report"
    CONFIG = "config"


# ============================================================================
# SQL ALCHEMY MODELS
# ============================================================================


class Source(Base):
    """Джерело вихідних даних."""

    __tablename__ = "sources"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    source_type = Column(String(50), nullable=False)  # SourceType
    config = Column(JSON)  # Connection config, API endpoints, etc.
    meta = Column(JSON)  # Additional metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    datasets = relationship("Dataset", back_populates="source")


class Dataset(Base):
    """Набір даних – результат успішного завантаження та парсингу Source."""

    __tablename__ = "datasets"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    source_id = Column(PostgreSQLUUID(as_uuid=True), ForeignKey("sources.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), nullable=False, default=DatasetStatus.UPLOADED)  # DatasetStatus

    # File/storage info
    file_path = Column(String(500))  # Path in MinIO
    file_size = Column(Integer)
    file_type = Column(String(50))  # csv, xlsx, pdf, etc.
    row_count = Column(Integer)

    # Processing info
    schema_info = Column(JSON)  # Column definitions, types
    processing_log = Column(JSON)  # Processing errors, warnings
    quality_score = Column(Float)  # Data quality metrics

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    source = relationship("Source", back_populates="datasets")
    jobs = relationship("Job", back_populates="dataset")
    indices = relationship("Index", back_populates="dataset")


class Job(Base):
    """Завдання/процес – бекенд-компонент, що виконує фонові операції."""

    __tablename__ = "jobs"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    dataset_id = Column(PostgreSQLUUID(as_uuid=True), ForeignKey("datasets.id"))
    job_type = Column(String(50), nullable=False)  # JobType
    status = Column(String(50), nullable=False, default=JobStatus.QUEUED)  # JobStatus

    # Job details
    name = Column(String(255), nullable=False)
    description = Column(Text)
    config = Column(JSON)  # Job configuration
    parameters = Column(JSON)  # Input parameters

    # Execution info
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    progress = Column(Float, default=0.0)  # 0-100%

    # Results
    result = Column(JSON)  # Output data, metrics
    error_message = Column(Text)
    logs = Column(JSON)  # Execution logs

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    dataset = relationship("Dataset", back_populates="jobs")
    artifacts = relationship("Artifact", back_populates="job")


class Index(Base):
    """Індекс пошуку – структура даних у OpenSearch або Qdrant."""

    __tablename__ = "indices"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    dataset_id = Column(PostgreSQLUUID(as_uuid=True), ForeignKey("datasets.id"), nullable=False)
    name = Column(String(255), nullable=False)
    index_type = Column(String(50), nullable=False)  # IndexType

    # Index configuration
    config = Column(JSON)  # Mapping, settings, dimensions
    vector_dimension = Column(Integer)  # For vector indexes

    # Statistics
    document_count = Column(Integer, default=0)
    index_size = Column(Integer)  # Size in bytes
    last_updated = Column(DateTime)

    # Health
    is_healthy = Column(Boolean, default=True)
    health_check = Column(JSON)  # Last health check results

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    dataset = relationship("Dataset", back_populates="indices")


class Artifact(Base):
    """Артефакт – будь-який файл або об'єкт, згенерований системою."""

    __tablename__ = "artifacts"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    job_id = Column(PostgreSQLUUID(as_uuid=True), ForeignKey("jobs.id"))
    artifact_type = Column(String(50), nullable=False)  # ArtifactType
    name = Column(String(255), nullable=False)
    description = Column(Text)

    # Storage info
    storage_path = Column(String(500))  # MinIO path
    storage_type = Column(String(50), default="minio")
    file_size = Column(Integer)
    file_hash = Column(String(64))  # SHA-256 hash

    # Metadata
    meta = Column(JSON)  # Type-specific metadata
    version = Column(String(50))
    tags = Column(JSON)  # List of tags

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="artifacts")


class NasTournament(Base):
    """NAS Tournament для Evolution/AutoML."""

    __tablename__ = "nas_tournaments"

    id = Column(String(100), primary_key=True)
    topic_id = Column(String(100))
    name = Column(String(255), nullable=False)
    dataset_id = Column(String(100))
    strategy = Column(String(50), default="EVOLUTIONARY")
    status = Column(String(50), default="RUNNING")
    current_generation = Column(Integer, default=1)
    max_generations = Column(Integer, default=10)
    best_score = Column(Float, default=0.0)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    configuration = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class NasCandidate(Base):
    """Кандидат NAS - модель-кандидат у турнірі."""

    __tablename__ = "nas_candidates"

    id = Column(String(100), primary_key=True)
    tournament_id = Column(String(100), ForeignKey("nas_tournaments.id"))
    architecture = Column(String(255))
    generation = Column(Integer, default=1)
    metrics = Column(JSON)
    status = Column(String(50), default="PENDING")
    provider = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# PYDANTIC MODELS (API)
# ============================================================================


class SourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    source_type: SourceType
    config: dict[str, Any] | None = None
    meta: dict[str, Any] | None = None


class SourceUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    config: dict[str, Any] | None = None
    meta: dict[str, Any] | None = None
    is_active: bool | None = None


class SourceResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    source_type: str
    config: dict[str, Any] | None
    meta: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class DatasetCreate(BaseModel):
    source_id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    file_path: str | None = None
    file_type: str | None = None


class DatasetUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    status: DatasetStatus | None = None
    schema_info: dict[str, Any] | None = None
    processing_log: dict[str, Any] | None = None
    quality_score: float | None = None


class DatasetResponse(BaseModel):
    id: UUID
    source_id: UUID
    name: str
    description: str | None
    status: str
    file_path: str | None
    file_size: int | None
    file_type: str | None
    row_count: int | None
    schema_info: dict[str, Any] | None
    processing_log: dict[str, Any] | None
    quality_score: float | None
    created_at: datetime
    updated_at: datetime

    # Nested relationships
    source: SourceResponse | None = None

    class Config:
        from_attributes = True


class JobCreate(BaseModel):
    dataset_id: UUID | None = None
    job_type: JobType
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    config: dict[str, Any] | None = None
    parameters: dict[str, Any] | None = None


class JobUpdate(BaseModel):
    status: JobStatus | None = None
    progress: float | None = Field(None, ge=0.0, le=100.0)
    result: dict[str, Any] | None = None
    error_message: str | None = None
    logs: dict[str, Any] | None = None


class JobResponse(BaseModel):
    id: UUID
    dataset_id: UUID | None
    job_type: str
    status: str
    name: str
    description: str | None
    config: dict[str, Any] | None
    parameters: dict[str, Any] | None
    started_at: datetime | None
    completed_at: datetime | None
    progress: float
    result: dict[str, Any] | None
    error_message: str | None
    logs: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime

    # Nested relationships
    dataset: DatasetResponse | None = None

    class Config:
        from_attributes = True


class IndexCreate(BaseModel):
    dataset_id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    index_type: IndexType
    config: dict[str, Any] | None = None
    vector_dimension: int | None = None


class IndexUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    config: dict[str, Any] | None = None
    document_count: int | None = None
    index_size: int | None = None
    is_healthy: bool | None = None
    health_check: dict[str, Any] | None = None


class IndexResponse(BaseModel):
    id: UUID
    dataset_id: UUID
    name: str
    index_type: str
    config: dict[str, Any] | None
    vector_dimension: int | None
    document_count: int
    index_size: int | None
    last_updated: datetime | None
    is_healthy: bool
    health_check: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime

    # Nested relationships
    dataset: DatasetResponse | None = None

    class Config:
        from_attributes = True


class ArtifactCreate(BaseModel):
    job_id: UUID | None = None
    artifact_type: ArtifactType
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    storage_path: str | None = None
    storage_type: str = "minio"
    meta: dict[str, Any] | None = None
    version: str | None = None
    tags: list[str] | None = None


class ArtifactUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    storage_path: str | None = None
    meta: dict[str, Any] | None = None
    version: str | None = None
    tags: list[str] | None = None


class ArtifactResponse(BaseModel):
    id: UUID
    job_id: UUID | None
    artifact_type: str
    name: str
    description: str | None
    storage_path: str | None
    storage_type: str
    file_size: int | None
    file_hash: str | None
    meta: dict[str, Any] | None
    version: str | None
    tags: list[str] | None
    created_at: datetime
    updated_at: datetime

    # Nested relationships
    job: JobResponse | None = None

    class Config:
        from_attributes = True


# ============================================================================
# SERVICE LAYER MODELS
# ============================================================================


class DataHubStats(BaseModel):
    """Statistics for Data Hub dashboard."""

    total_sources: int
    active_sources: int
    total_datasets: int
    datasets_by_status: dict[str, int]
    total_jobs: int
    jobs_by_status: dict[str, int]
    storage_used: int  # bytes
    recent_uploads: list[DatasetResponse]


class UploadWizardResult(BaseModel):
    """Result from upload wizard."""

    source: SourceResponse
    dataset: DatasetResponse
    job: JobResponse
    preview: dict[str, Any] | None = None


class PipelineConfig(BaseModel):
    """Configuration for ETL/Processing pipelines."""

    pipeline_type: JobType
    input_dataset_id: UUID
    config: dict[str, Any]
    retry_count: int = 3
    timeout_seconds: int = 3600
