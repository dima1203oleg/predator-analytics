"""
UA Sources - Celery App Configuration
Celery worker for background tasks with Beat scheduling
"""
from celery import Celery
from .config import settings

celery_app = Celery(
    "ua_sources",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.etl",
        "app.tasks.ua_sources",
        "app.tasks.etl_workers",
        "app.tasks.maintenance",
        "app.tasks.monitoring"
    ]
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
    # Result expiration
    result_expires=86400,  # 24 hours
)

# Task routes - assign tasks to specific queues
celery_app.conf.task_routes = {
    # ETL Workers
    "tasks.workers.*": {"queue": "etl"},
    # Ingestion
    "app.tasks.etl.*": {"queue": "etl"},
    "app.tasks.ingestion.*": {"queue": "ingestion"},
    # Maintenance
    "tasks.maintenance.*": {"queue": "maintenance"},
    # Monitoring
    "tasks.monitoring.*": {"queue": "monitoring"},
    # Analytics
    "app.tasks.analytics.*": {"queue": "analytics"},
}

# Import and apply beat schedule
from .beat_schedule import CELERY_BEAT_SCHEDULE
celery_app.conf.beat_schedule = CELERY_BEAT_SCHEDULE

