from __future__ import annotations

"""Temporal.io Client Factory
Provides reliable connection to Temporal server for durable execution.
"""
import os

from temporalio.client import Client
from temporalio.worker import Worker

from app.libs.core.structured_logger import get_logger

logger = get_logger("predator.core.temporal")

_client: Client | None = None


async def get_temporal_client() -> Client:
    """Get or create Temporal client connection."""
    global _client
    if _client is None:
        try:
            temporal_host = os.getenv("TEMPORAL_HOST", "temporal:7233")
            _client = await Client.connect(temporal_host, namespace="default")
            logger.info("✅ Connected to Temporal", host=temporal_host)
        except Exception as e:
            logger.exception("Failed to connect to Temporal", error=str(e))
            raise
    return _client


async def run_worker(task_queue: str, workflows: list, activities: list):
    """Run a Temporal worker."""
    client = await get_temporal_client()
    worker = Worker(client, task_queue=task_queue, workflows=workflows, activities=activities)
    logger.info(f"🚀 Temporal Worker started on queue: {task_queue}")
    await worker.run()
