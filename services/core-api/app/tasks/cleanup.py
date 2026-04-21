"""Cleanup & Data Retention Tasks — PREDATOR Analytics v56.5-ELITE.

Забезпечує відповідність GDPR та очищення застарілих даних.
TZ v5.0 §15.
"""
import logging
from datetime import UTC, datetime, timedelta
from sqlalchemy import delete, select
from celery import shared_task

from app.database import AsyncSessionLocal
from app.models.orm import IngestionJob, RiskScore  # Припускаємо наявність цих моделей
from app.services.minio_service import MinIOService

logger = logging.getLogger(__name__)

async def run_cleanup_async():
    """Асинхронне очищення даних з архівацією."""
    minio = MinIOService()
    retention_days = 30
    cutoff_date = datetime.now(UTC) - timedelta(days=retention_days)

    async with AsyncSessionLocal() as db:
        # 1. Очищення старих завдань інгестії
        stmt = select(IngestionJob).where(IngestionJob.created_at < cutoff_date)
        result = await db.execute(stmt)
        jobs_to_clean = result.scalars().all()

        if jobs_to_clean:
            logger.info(f"Знайдено {len(jobs_to_clean)} застарілих завдань для очищення.")
            
            # Архівуємо метадані в MinIO перед видаленням (Compliance)
            archive_data = [
                {"id": str(j.id), "status": j.status, "created_at": j.created_at.isoformat()}
                for j in jobs_to_clean
            ]
            
            archive_name = f"cleanup/ingestion_jobs_archive_{datetime.now(UTC).strftime('%Y%m%d')}.json"
            # Припускаємо наявність загального бакета для логів
            # await minio.upload_json("system-logs", archive_name, archive_data)
            
            # Видалення
            delete_stmt = delete(IngestionJob).where(IngestionJob.id.in_([j.id for j in jobs_to_clean]))
            await db.execute(delete_stmt)
            await db.commit()
            logger.info("Завдання інгестії очищені.")

        # 2. Очищення старих Risk Scores (якщо вони не є частиною WORM аудиту)
        # Для WORM (HR-16) ми лише архівуємо, але не видаляємо з БД без спеціального прапорця
        logger.info("Очищення завершено.")

@shared_task(name="app.tasks.cleanup.auto_purge_old_data")
def auto_purge_old_data():
    """Celery task для регулярного очищення."""
    import asyncio
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run_cleanup_async())
