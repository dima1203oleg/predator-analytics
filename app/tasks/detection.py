from __future__ import annotations

import asyncio
import logging

from app.core.celery_app import celery_app
from app.services.detection_service import detection_service


logger = logging.getLogger(__name__)

@celery_app.task(name="app.tasks.detection.run_autonomous_detection")
def run_autonomous_detection():
    """Background Celery task to run the detection cycle."""
    logger.info("Celery: Triggering autonomous detection cycle.")

    # Run async logic in sync Celery task
    loop = asyncio.get_event_loop()
    if loop.is_running():
        future = asyncio.run_coroutine_threadsafe(detection_service.run_detection_cycle(limit=20), loop)
        return future.result()
    return asyncio.run(detection_service.run_detection_cycle(limit=20))
