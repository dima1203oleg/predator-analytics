from __future__ import annotations


"""🔒 Data Contracts для Predator Analytics v45.

Формалізація всіх payload structures з Pydantic для:
- Celery tasks
- Redis events
- API requests/responses
- Internal service communication

Переваги:
- Runtime validation
- Auto-generated documentation
- Type safety
- IDE autocomplete
"""

from datetime import datetime
from enum import Enum, StrEnum
from typing import Any
import uuid

from pydantic import BaseModel, Field, field_validator, model_validator


# ═══════════════════════════════════════════════════════════════════════════
# ENUMS - Загальні перелічення
# ═══════════════════════════════════════════════════════════════════════════


class TaskPriority(int, Enum):
    """Пріоритет задачі (1=lowest, 10=highest)."""

    LOWEST = 1
    LOW = 3
    NORMAL = 5
    HIGH = 7
    CRITICAL = 10


class DatasetType(StrEnum):
    """Типи датасетів."""

    CUSTOMS = "customs"
    TENDERS = "tenders"
    COMPANIES = "companies"
    COURT_CASES = "court_cases"
    GENERIC = "generic"


class MLModelType(StrEnum):
    """Типи ML моделей."""

    AUTOML = "automl"
    ANOMALY = "anomaly"
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    CLUSTERING = "clustering"


class JobStatus(StrEnum):
    """Статуси job."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


# ═══════════════════════════════════════════════════════════════════════════
# CELERY TASK PAYLOADS
# ═══════════════════════════════════════════════════════════════════════════


class ETLTaskPayload(BaseModel):
    """Contract для ETL processing tasks.

    Queue: etl_queue
    Task: tasks.etl_workers.process_file_task
    """

    source_id: str = Field(..., description="Unique source identifier")
    file_path: str = Field(..., description="Path to file in MinIO bucket")
    dataset_type: DatasetType = Field(default=DatasetType.GENERIC)
    options: dict[str, Any] = Field(
        default_factory=dict, description="Processing options (validate_schema, chunk_size, etc)"
    )
    priority: TaskPriority = Field(default=TaskPriority.NORMAL)
    callback_url: str | None = Field(None, description="Webhook after completion")

    @field_validator("file_path")
    @classmethod
    def validate_file_path(cls, v):
        """Перевірка що file_path не порожній."""
        if not v or not v.strip():
            raise ValueError("file_path cannot be empty")
        return v.strip()

    model_config = {
        "json_schema_extra": {
            "example": {
                "source_id": "src_march_2024",
                "file_path": "raw-data/customs/Березень_2024.xlsx",
                "dataset_type": "customs",
                "options": {"validate_schema": True, "chunk_size": 1000, "skip_rows": 0},
                "priority": 8,
                "callback_url": "https://api.example.com/webhook",
            }
        }
    }


class MLTrainingPayload(BaseModel):
    """Contract для ML training tasks.

    Queue: ml_queue
    Task: tasks.ml_workers.train_model_task
    """

    dataset_id: str = Field(..., description="Dataset UUID")
    model_type: MLModelType = Field(default=MLModelType.AUTOML)
    hyperparameters: dict[str, Any] = Field(
        default_factory=dict, description="Model hyperparameters"
    )
    training_config: dict[str, Any] | None = Field(
        None, description="Advanced training config (epochs, batch_size, etc)"
    )
    auto_deploy: bool = Field(default=False, description="Auto-deploy if accuracy > threshold")
    accuracy_threshold: float = Field(
        default=0.85, ge=0.0, le=1.0, description="Min accuracy for auto-deploy"
    )

    @field_validator("dataset_id")
    @classmethod
    def validate_dataset_id(cls, v):
        """Validate UUID format."""
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError("dataset_id must be valid UUID")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "dataset_id": "550e8400-e29b-41d4-a716-446655440000",
                "model_type": "automl",
                "hyperparameters": {"max_models": 20, "max_runtime_secs": 3600},
                "training_config": {"validation_split": 0.2, "seed": 42},
                "auto_deploy": True,
                "accuracy_threshold": 0.90,
            }
        }
    }


class IndexingTaskPayload(BaseModel):
    """Contract для indexing tasks (OpenSearch + Qdrant).

    Queue: indexing_queue
    Task: tasks.indexing.index_documents_task
    """

    documents: list[dict[str, Any]] = Field(..., min_length=1, max_length=10000)
    index_name: str = Field(..., pattern="^[a-z][a-z0-9_-]*$")
    collection_name: str = Field(..., description="Qdrant collection name")
    batch_size: int = Field(default=100, ge=1, le=1000)
    generate_embeddings: bool = Field(default=True, description="Generate vector embeddings")
    pii_safe: bool = Field(default=True, description="Remove PII before indexing")

    @field_validator("documents")
    @classmethod
    def validate_documents(cls, v):
        """Validate each document has required fields."""
        required_fields = ["content"]
        for doc in v:
            if not any(field in doc for field in required_fields):
                raise ValueError("Each document must have 'content' field")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "documents": [
                    {
                        "id": "doc_001",
                        "content": "Митна декларація...",
                        "metadata": {"source": "customs"},
                    }
                ],
                "index_name": "documents_2024",
                "collection_name": "documents",
                "batch_size": 100,
                "generate_embeddings": True,
                "pii_safe": True,
            }
        }
    }


class MaintenanceTaskPayload(BaseModel):
    """Contract для maintenance tasks.

    Queue: maintenance_queue
    Task: tasks.maintenance.run_maintenance_task
    """

    operation: str = Field(
        ..., pattern="^(vacuum_db|reclaim_vectors|optimize_indexes|cleanup_old_data)$"
    )
    target: str | None = Field(None, description="Specific target (table name, collection, etc)")
    dry_run: bool = Field(default=False, description="Simulate without applying changes")
    schedule_time: datetime | None = Field(None, description="Run at specific time")

    model_config = {
        "json_schema_extra": {
            "example": {
                "operation": "vacuum_db",
                "target": "documents",
                "dry_run": False,
                "schedule_time": None,
            }
        }
    }


# ═══════════════════════════════════════════════════════════════════════════
# REDIS EVENT SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════


class EventType(StrEnum):
    """Types of events."""

    JOB_CREATED = "job.created"
    JOB_STARTED = "job.started"
    JOB_PROGRESS = "job.progress"
    JOB_COMPLETED = "job.completed"
    JOB_FAILED = "job.failed"
    ALERT_TRIGGERED = "alert.triggered"
    MISSION_CREATED = "mission.created"
    MISSION_COMPLETED = "mission.completed"


class RedisEvent(BaseModel):
    """Base event structure for Redis pub/sub.

    Channel: events:{event_type}
    """

    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: EventType
    payload: dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)
    correlation_id: str | None = Field(None, description="For distributed tracing")
    source_service: str = Field(..., description="Service that emitted event")

    model_config = {
        "json_schema_extra": {
            "example": {
                "event_id": "evt_123",
                "event_type": "job.completed",
                "payload": {"job_id": "job_456", "status": "succeeded", "duration_ms": 5432},
                "timestamp": "2026-01-11T21:30:00Z",
                "correlation_id": "req_789",
                "source_service": "celery_worker",
            }
        }
    }


class JobProgressEvent(RedisEvent):
    """Специфічний event для progress updates."""

    event_type: EventType = EventType.JOB_PROGRESS

    @model_validator(mode="after")
    def validate_progress_payload(self) -> JobProgressEvent:
        """Validate progress payload has required fields."""
        payload = self.payload or {}
        required = ["job_id", "progress_percent", "current_step"]
        if not all(key in payload for key in required):
            raise ValueError(f"Progress event must have fields: {required}")
        return self


# ═══════════════════════════════════════════════════════════════════════════
# API REQUEST/RESPONSE CONTRACTS
# ═══════════════════════════════════════════════════════════════════════════


class SearchRequest(BaseModel):
    """Contract для search API."""

    query: str = Field(..., min_length=1, max_length=500)
    mode: str = Field(default="hybrid", pattern="^(semantic|keyword|hybrid)$")
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    filters: dict[str, Any] | None = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "query": "митні декларації з Китаю",
                "mode": "hybrid",
                "limit": 20,
                "offset": 0,
                "filters": {"source_type": "customs", "date_from": "2024-01-01"},
            }
        }
    }


class SearchResponse(BaseModel):
    """Contract для search results."""

    success: bool = True
    results: list[dict[str, Any]]
    total: int
    took_ms: int
    mode: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "results": [{"id": "doc_123", "title": "Митна декларація...", "score": 0.95}],
                "total": 1234,
                "took_ms": 45,
                "mode": "hybrid",
            }
        }
    }


class CreateMissionRequest(BaseModel):
    """Contract для Mission Planner API."""

    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    priority: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    context: dict[str, Any] = Field(default_factory=dict)

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Аналіз кіберзагрози APT-2024-001",
                "description": "Виявлено підозрілу активність. Необхідний аналіз через SIGINT та CYBINT.",
                "priority": "high",
                "context": {"threat_id": "APT-2024-001", "source_ip": "192.168.1.100"},
            }
        }
    }


# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════


def validate_payload(payload_class: BaseModel, data: dict[str, Any]) -> BaseModel:
    """Validate and parse payload data.

    Usage:
        payload = validate_payload(ETLTaskPayload, task_kwargs)
    """
    try:
        return payload_class(**data)
    except Exception as e:
        raise ValueError(f"Invalid payload for {payload_class.__name__}: {e}")


def serialize_for_redis(event: RedisEvent) -> str:
    """Serialize event for Redis pub/sub.

    Usage:
        redis.publish('events:job.completed', serialize_for_redis(event))
    """
    return event.json()


def deserialize_from_redis(event_json: str) -> RedisEvent:
    """Deserialize event from Redis.

    Usage:
        event = deserialize_from_redis(message['data'])
    """
    return RedisEvent.parse_raw(event_json)
