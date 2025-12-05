"""
UA Sources - Celery Worker
Background task processing for ETL and data operations
"""
from celery import Celery
from .core.config import settings
import logging

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "ua_sources",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["ua-sources.app.tasks.etl", "ua-sources.app.tasks.ua_sources"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Kyiv",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
)

# Task routes
celery_app.conf.task_routes = {
    "tasks.etl.*": {"queue": "etl"},
    "tasks.ingestion.*": {"queue": "ingestion"},
    "tasks.analytics.*": {"queue": "analytics"},
}

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "sync-prozorro-hourly": {
        "task": "tasks.etl.sync_prozorro",
        "schedule": 3600.0,  # Every hour
    },
    "sync-nbu-rates-daily": {
        "task": "tasks.etl.sync_nbu_rates",
        "schedule": 86400.0,  # Every day
    },
    "cleanup-old-data-weekly": {
        "task": "tasks.maintenance.cleanup",
        "schedule": 604800.0,  # Every week
    },
}


@celery_app.task(bind=True)
def health_check(self):
    """Health check task"""
    return {"status": "healthy", "worker_id": self.request.id}


if __name__ == "__main__":
    celery_app.start()
