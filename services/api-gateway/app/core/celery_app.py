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
        "app.tasks.monitoring",
        "app.tasks.ingestion",
        "app.tasks.augmentation",
        "app.tasks.ml_workers"
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
    # Result expiration
    result_expires=86400,  # 24 hours

    # Monitoring Events (Critical for v25 JobQueueMonitor)
    worker_send_task_events=True,
    task_send_sent_event=True,

    # Reliability & Enterprise Resilience
    task_acks_late=True,
    worker_cancel_long_running_tasks_on_connection_loss=True,
    task_reject_on_worker_lost=True,

    # Flower Security (v25.0)
    flower_basic_auth=f"{settings.FLOWER_USER}:{settings.FLOWER_PASSWORD}" if settings.FLOWER_USER and settings.FLOWER_PASSWORD else None,
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
    "app.tasks.augmentation.*": {"queue": "analytics"},
    "tasks.ml.*": {"queue": "analytics"},
}

# Import and apply beat schedule
from .beat_schedule import CELERY_BEAT_SCHEDULE
celery_app.conf.beat_schedule = CELERY_BEAT_SCHEDULE
