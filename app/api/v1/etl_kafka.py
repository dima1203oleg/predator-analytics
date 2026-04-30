"""ETL Kafka Ingestion API (Phase 4 — SM Edition).

Endpoints for Kafka ingestion worker, job lifecycle, DLQ, and SSE progress.
"""
from typing import Any

from fastapi import APIRouter

from app.services.etl.kafka_ingestion_worker import (
    KafkaIngestionWorker,
    SSEProgressTracker,
)

router = APIRouter(prefix="/etl/kafka", tags=["ETL & Ingestion"])

_worker = KafkaIngestionWorker()
_sse = SSEProgressTracker()


@router.get("/worker/status")
async def get_worker_status() -> dict[str, Any]:
    """Стан Kafka ingestion worker."""
    return _worker.get_worker_status()


@router.get("/lifecycle")
async def get_job_lifecycle() -> dict[str, Any]:
    """Інформація про lifecycle станів job'ів."""
    return _worker.get_job_lifecycle_info()


@router.post("/lifecycle/validate")
async def validate_transition(current: str, target: str) -> dict[str, Any]:
    """Валідація переходу стану job'а."""
    return _worker.validate_transition(current, target)


@router.get("/dlq")
async def get_dlq_info() -> dict[str, Any]:
    """Інформація про Dead Letter Queue."""
    return _worker.get_dlq_info()


@router.get("/sse/config")
async def get_sse_config() -> dict[str, Any]:
    """Конфігурація SSE progress tracker."""
    return _sse.get_config()
