from __future__ import annotations


"""UA Sources - Celery Worker Entry Point."""
from app.core.celery_app import celery_app


if __name__ == "__main__":
    celery_app.start()
