"""
UA Sources - Celery App Configuration
Celery worker for background tasks
"""
from celery import Celery
from .config import settings

celery_app = Celery(
    "ua_sources",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["ua-sources.app.tasks.etl", "ua-sources.app.tasks.ua_sources"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Kyiv",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    worker_prefetch_multiplier=1,
)

celery_app.conf.beat_schedule = {
    "sync-nbu-rates": {
        "task": "tasks.etl.sync_nbu_rates",
        "schedule": 86400.0,
    },
}
