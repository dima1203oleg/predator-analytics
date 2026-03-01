from __future__ import annotations

import asyncio
import logging
import uuid

from app.core.celery_app import celery_app
from app.database import async_session_maker

from src.mlops.augmentor import AugmentorManager


logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.augmentation.process_augmentation", queue="analytics")
def process_augmentation_task(self, doc_id_str: str, num_variants: int = 2):
    """Celery task to generate synthetic data for a document."""
    logger.info(f"Starting augmentation task for doc_id: {doc_id_str}")

    doc_id = uuid.UUID(doc_id_str)

    async def _run():
        async with async_session_maker() as session:
            manager = AugmentorManager(session)
            return await manager.generate_synthetic_data(doc_id, num_variants)

    try:
        result = asyncio.run(_run())
        return {"status": "success", "generated_count": len(result)}
    except Exception as e:
        logger.exception(f"Augmentation task failed: {e}")
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(name="app.tasks.augmentation.bulk_augment", queue="analytics")
def bulk_augment_task(tenant_id_str: str, limit: int = 10):
    """Bulk augmentation task for a tenant."""
    tenant_id = uuid.UUID(tenant_id_str)

    async def _run():
        async with async_session_maker() as session:
            manager = AugmentorManager(session)
            return await manager.augment_for_tenant(tenant_id, limit)

    try:
        count = asyncio.run(_run())
        return {"status": "success", "total_generated": count}
    except Exception as e:
        logger.exception(f"Bulk augmentation failed: {e}")
        return {"status": "error", "message": str(e)}
