"""
Temporal.io Client Factory
Provides reliable connection to Temporal server for durable execution.
"""
import os
from typing import Optional
from temporalio.client import Client
from temporalio.worker import Worker
from libs.core.config import settings
from libs.core.structured_logger import get_logger

logger = get_logger("predator.core.temporal")

_client: Optional[Client] = None

async def get_temporal_client() -> Client:
    """Get or create Temporal client connection"""
    global _client
    if _client is None:
        try:
            temporal_host = os.getenv("TEMPORAL_HOST", "temporal:7233")
            _client = await Client.connect(temporal_host, namespace="default")
            logger.info("✅ Connected to Temporal", host=temporal_host)
        except Exception as e:
            logger.error("Failed to connect to Temporal", error=str(e))
            raise e
    return _client

async def run_worker(task_queue: str, workflows: list, activities: list):
    """Run a Temporal worker"""
    client = await get_temporal_client()
    worker = Worker(
        client,
        task_queue=task_queue,
        workflows=workflows,
        activities=activities
    )
    logger.info(f"🚀 Temporal Worker started on queue: {task_queue}")
    await worker.run()
