from __future__ import annotations

import asyncio
import logging

from src.ingestion.manager import IngestionManager

from app.core.celery_app import celery_app
from app.database import async_session_maker

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.ingestion.process_file", queue="ingestion")
def process_file_task(self, record_id: str):
    """Celery task to process an uploaded file.
    Wraps the async IngestionManager logic.
    """
    logger.info(f"Starting ingestion task for record_id: {record_id}")

    async def _run():
        async with async_session_maker() as session:
            manager = IngestionManager(session)
            await manager.process_file(record_id)

    try:
        # Create a new event loop for this task execution
        msg = f"Processing file {record_id}"
        logger.info(msg)
        asyncio.run(_run())
        return {"status": "success", "record_id": record_id}
    except Exception as e:
        logger.exception(f"Ingestion task failed: {e}")
        # Retry logic could be added here
        raise self.retry(exc=e, countdown=60, max_retries=3)
