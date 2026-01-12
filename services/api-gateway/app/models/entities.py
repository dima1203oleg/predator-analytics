"""
Predator Analytics v25 - Canonical Entities
Source, Dataset, Job, Index, Artifact definitions
"""
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List
from uuid import UUID, uuid4
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, JSON, Text, Integer, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# ============================================================================
# ENUMS
# ============================================================================

class SourceType(str, Enum):
    FILE = "file"
    API = "api"
    DATABASE = "database"
    STREAM = "stream"
    WEBHOOK = "webhook"

class DatasetStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"

class JobType(str, Enum):
    INGESTION = "ingestion"
    ETL = "etl"
    INDEXING = "indexing"
    TRAINING = "training"
    SYNTHETIC = "synthetic"
    OPTIMIZATION = "optimization"

class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class IndexType(str, Enum):
    OPENSEARCH = "opensearch"
    QDRANT = "qdrant"
    HYBRID = "hybrid"

class ArtifactType(str, Enum):
    MODEL = "model"
    DATASET = "dataset"
    LOG = "log"
    REPORT = "report"
    CONFIG = "config"

# ============================================================================
# SQL ALCHEMY MODELS
# ============================================================================

class Source(Base):
    """Джерело вихідних даних"""
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
    """Набір даних – результат успішного завантаження та парсингу Source"""
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
    """Завдання/процес – бекенд-компонент, що виконує фонові операції"""
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
    """Індекс пошуку – структура даних у OpenSearch або Qdrant"""
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
    """Артефакт – будь-який файл або об'єкт, згенерований системою"""
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
    """NAS Tournament для Evolution/AutoML"""
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
    """Кандидат NAS - модель-кандидат у турнірі"""
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
    description: Optional[str] = None
    source_type: SourceType
    config: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None

class SourceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class SourceResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    source_type: str
    config: Optional[Dict[str, Any]]
    meta: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class DatasetCreate(BaseModel):
    source_id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None

class DatasetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[DatasetStatus] = None
    schema_info: Optional[Dict[str, Any]] = None
    processing_log: Optional[Dict[str, Any]] = None
    quality_score: Optional[float] = None

class DatasetResponse(BaseModel):
    id: UUID
    source_id: UUID
    name: str
    description: Optional[str]
    status: str
    file_path: Optional[str]
    file_size: Optional[int]
    file_type: Optional[str]
    row_count: Optional[int]
    schema_info: Optional[Dict[str, Any]]
    processing_log: Optional[Dict[str, Any]]
    quality_score: Optional[float]
    created_at: datetime
    updated_at: datetime

    # Nested relationships
    source: Optional[SourceResponse] = None

    class Config:
        from_attributes = True

class JobCreate(BaseModel):
    dataset_id: Optional[UUID] = None
    job_type: JobType
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None

class JobUpdate(BaseModel):
    status: Optional[JobStatus] = None
    progress: Optional[float] = Field(None, ge=0.0, le=100.0)
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    logs: Optional[Dict[str, Any]] = None

class JobResponse(BaseModel):
    id: UUID
    dataset_id: Optional[UUID]
    job_type: str
    status: str
    name: str
    description: Optional[str]
    config: Optional[Dict[str, Any]]
    parameters: Optional[Dict[str, Any]]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    progress: float
    result: Optional[Dict[str, Any]]
    error_message: Optional[str]
    logs: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    # Nested relationships
    dataset: Optional[DatasetResponse] = None

    class Config:
        from_attributes = True

class IndexCreate(BaseModel):
    dataset_id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    index_type: IndexType
    config: Optional[Dict[str, Any]] = None
    vector_dimension: Optional[int] = None

class IndexUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    config: Optional[Dict[str, Any]] = None
    document_count: Optional[int] = None
    index_size: Optional[int] = None
    is_healthy: Optional[bool] = None
    health_check: Optional[Dict[str, Any]] = None

class IndexResponse(BaseModel):
    id: UUID
    dataset_id: UUID
    name: str
    index_type: str
    config: Optional[Dict[str, Any]]
    vector_dimension: Optional[int]
    document_count: int
    index_size: Optional[int]
    last_updated: Optional[datetime]
    is_healthy: bool
    health_check: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    # Nested relationships
    dataset: Optional[DatasetResponse] = None

    class Config:
        from_attributes = True

class ArtifactCreate(BaseModel):
    job_id: Optional[UUID] = None
    artifact_type: ArtifactType
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    storage_path: Optional[str] = None
    storage_type: str = "minio"
    meta: Optional[Dict[str, Any]] = None
    version: Optional[str] = None
    tags: Optional[List[str]] = None

class ArtifactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    storage_path: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    version: Optional[str] = None
    tags: Optional[List[str]] = None

class ArtifactResponse(BaseModel):
    id: UUID
    job_id: Optional[UUID]
    artifact_type: str
    name: str
    description: Optional[str]
    storage_path: Optional[str]
    storage_type: str
    file_size: Optional[int]
    file_hash: Optional[str]
    meta: Optional[Dict[str, Any]]
    version: Optional[str]
    tags: Optional[List[str]]
    created_at: datetime
    updated_at: datetime

    # Nested relationships
    job: Optional[JobResponse] = None

    class Config:
        from_attributes = True

# ============================================================================
# SERVICE LAYER MODELS
# ============================================================================

class DataHubStats(BaseModel):
    """Statistics for Data Hub dashboard"""
    total_sources: int
    active_sources: int
    total_datasets: int
    datasets_by_status: Dict[str, int]
    total_jobs: int
    jobs_by_status: Dict[str, int]
    storage_used: int  # bytes
    recent_uploads: List[DatasetResponse]

class UploadWizardResult(BaseModel):
    """Result from upload wizard"""
    source: SourceResponse
    dataset: DatasetResponse
    job: JobResponse
    preview: Optional[Dict[str, Any]] = None

class PipelineConfig(BaseModel):
    """Configuration for ETL/Processing pipelines"""
    pipeline_type: JobType
    input_dataset_id: UUID
    config: Dict[str, Any]
    retry_count: int = 3
    timeout_seconds: int = 3600
