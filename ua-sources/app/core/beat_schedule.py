"""
Celery Beat Schedule Configuration
Periodic tasks for ETL pipeline automation
"""
from celery.schedules import crontab

# Beat schedule for automated ETL tasks
CELERY_BEAT_SCHEDULE = {
    # ============================================================================
    # DATA INGESTION (Parser)
    # ============================================================================
    
    "prozorro-sync-hourly": {
        "task": "tasks.workers.parse_external_source",
        "schedule": crontab(minute=0),  # Every hour at :00
        "args": ("prozorro", {"limit": 100}),
        "options": {"queue": "ingestion"}
    },
    
    "nbu-rates-daily": {
        "task": "tasks.workers.parse_external_source",
        "schedule": crontab(hour=9, minute=0),  # Every day at 09:00
        "args": ("nbu", {}),
        "options": {"queue": "ingestion"}
    },
    
    "customs-sync-every-6-hours": {
        "task": "tasks.workers.parse_external_source",
        "schedule": crontab(hour="*/6", minute=30),  # Every 6 hours at :30
        "args": ("customs", {"limit": 200}),
        "options": {"queue": "ingestion"}
    },
    
    # ============================================================================
    # MAINTENANCE TASKS
    # ============================================================================
    
    "full-reindex-weekly": {
        "task": "tasks.workers.full_reindex",
        "schedule": crontab(hour=2, minute=0, day_of_week="sunday"),  # Sunday 02:00
        "options": {"queue": "etl"}
    },
    
    "cleanup-old-staging-monthly": {
        "task": "tasks.maintenance.cleanup_staging",
        "schedule": crontab(hour=3, minute=0, day_of_month=1),  # 1st of month at 03:00
        "args": (90,),  # Keep 90 days
        "options": {"queue": "maintenance"}
    },
    
    # ============================================================================
    # HEALTH CHECKS
    # ============================================================================
    
    "health-check-every-5-min": {
        "task": "tasks.monitoring.health_check",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
        "options": {"queue": "monitoring", "expires": 300}
    },
    
    "index-stats-hourly": {
        "task": "tasks.monitoring.collect_index_stats",
        "schedule": crontab(minute=15),  # Every hour at :15
        "options": {"queue": "monitoring"}
    },
}


def apply_beat_schedule(celery_app):
    """Apply beat schedule to Celery app"""
    celery_app.conf.beat_schedule = CELERY_BEAT_SCHEDULE
    celery_app.conf.timezone = "Europe/Kyiv"
    return celery_app
