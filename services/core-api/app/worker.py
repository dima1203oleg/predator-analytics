"""Celery App — PREDATOR Analytics v55.2-SM-EXTENDED.

Ініціалізація Celery для фонових задач (Data Freshness, ML retrains тощо).
"""
import os
from celery import Celery

# Конфігурація з .env або default
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "predator_tasks",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks.freshness", "app.tasks.ai_maintenance", "app.tasks.cleanup"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

# Розклад задач (Celery Beat)
celery_app.conf.beat_schedule = {
    # Перевірка свіжості даних кожні 15 хвилин
    "check-data-freshness-every-15-minutes": {
        "task": "app.tasks.freshness.check_data_freshness",
        "schedule": 900.0,  # 15 хвилин
    },
    # Щоденний снапшот графа Neo4j (Фаза 3)
    "daily-graph-snapshot": {
        "task": "app.tasks.ai_maintenance.daily_graph_snapshot",
        "schedule": 86400.0,  # 24 години
    },
    # Щотижневий аналіз дрейфу моделей (Фаза 3)
    "weekly-drift-detection": {
        "task": "app.tasks.ai_maintenance.weekly_drift_detection",
        "schedule": 604800.0,  # 7 днів
    },
    # Очищення даних (GDPR / Retention)
    "weekly-gdpr-cleanup": {
        "task": "app.tasks.cleanup.auto_purge_old_data",
        "schedule": 604800.0,  # 7 днів (щонеділі)
    },
    # Щоденне адаптивне перенавчання моделей (AutoML)
    "daily-automl-retrain": {
        "task": "app.tasks.ai_maintenance.nightly_model_retrain",
        "schedule": 86400.0,  # 24 години
    },
}
