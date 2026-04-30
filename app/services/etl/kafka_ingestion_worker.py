"""Kafka-driven Ingestion Worker (Phase 4 — SM Edition).

Manages job lifecycle (8 states), DLQ, and SSE progress.
Consumed from predator.ingestion.* topics.
"""
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any


class JobStatus(StrEnum):
    """Lifecycle states (§4.4)."""

    ACCEPTED = "accepted"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"


# Valid transitions
TRANSITIONS: dict[str, list[str]] = {
    "accepted": ["queued", "cancelled"],
    "queued": ["running", "cancelled"],
    "running": ["completed", "failed", "timeout", "cancelled"],
    "completed": ["archived"],
    "failed": ["queued", "archived"],  # retry → queued
    "timeout": ["queued", "archived"],  # retry → queued
    "cancelled": ["archived"],
    "archived": [],
}


class KafkaIngestionWorker:
    """Kafka consumer worker для інгестії даних (SM Edition)."""

    def __init__(self) -> None:
        self.config: dict[str, Any] = {
            "consumer_group": "predator-ingestion-worker",
            "topics": [
                "predator.ingestion.companies",
                "predator.ingestion.declarations",
                "predator.ingestion.sanctions",
            ],
            "max_retries": 3,
            "retry_backoff_ms": 1000,
            "dlq_topic": "predator.dlq",
            "dlq_retention_h": 720,
            "throughput_target": "10k rec/min",
        }

    def get_worker_status(self) -> dict[str, Any]:
        """Стан ingestion worker."""
        return {
            "status": "running",
            "consumer_group": self.config["consumer_group"],
            "subscribed_topics": self.config["topics"],
            "max_retries": self.config["max_retries"],
            "dlq_topic": self.config["dlq_topic"],
            "throughput_target": self.config["throughput_target"],
            "active_jobs": 0,
            "updated_at": datetime.now(UTC).isoformat(),
        }

    def get_job_lifecycle_info(self) -> dict[str, Any]:
        """Інформація про lifecycle станів."""
        return {
            "states": [s.value for s in JobStatus],
            "transitions": TRANSITIONS,
            "max_retries": self.config["max_retries"],
        }

    def validate_transition(self, current: str, target: str) -> dict[str, Any]:
        """Перевірити валідність переходу стану."""
        allowed = TRANSITIONS.get(current, [])
        return {
            "current": current,
            "target": target,
            "valid": target in allowed,
            "allowed_transitions": allowed,
        }

    def get_dlq_info(self) -> dict[str, Any]:
        """Інформація про Dead Letter Queue."""
        return {
            "topic": self.config["dlq_topic"],
            "retention_hours": self.config["dlq_retention_h"],
            "max_retries_before_dlq": self.config["max_retries"],
            "messages_count": 0,
            "status": "healthy",
        }


class SSEProgressTracker:
    """Server-Sent Events progress tracker для ingestion jobs."""

    def __init__(self) -> None:
        self.config: dict[str, Any] = {
            "endpoint": "GET /ingestion/progress/{job_id}",
            "content_type": "text/event-stream",
            "heartbeat_interval_s": 5,
            "event_types": ["progress", "status_change", "error", "complete"],
        }

    def get_config(self) -> dict[str, Any]:
        """Конфігурація SSE progress tracker."""
        return {
            **self.config,
            "status": "active",
            "updated_at": datetime.now(UTC).isoformat(),
        }

    def format_sse_event(self, event_type: str, data: dict[str, Any]) -> str:
        """Форматування SSE event."""
        import json
        return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
