"""Module: worker
Component: audit-worker
Predator Analytics v45.1.
"""

import asyncio
import hashlib
import json
import logging
import os
import uuid

import asyncpg
import redis.asyncio as redis

from services.shared.events import PredatorEvent
from services.shared.logging_config import setup_logging


setup_logging("audit-worker")
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://predator-analytics-redis:6379")
DATABASE_URL = os.getenv("DATABASE_URL")


class AuditWorker:
    def __init__(self):
        self.redis_client = None
        self.db_pool = None

    async def connect(self):
        self.redis_client = redis.from_url(REDIS_URL)
        self.db_pool = await asyncpg.create_pool(DATABASE_URL)
        logger.info("Audit Worker connected to Redis and PostgreSQL")

    def _compute_integrity_hash(self, data: dict) -> str:
        """Computes SHA256 of the audit record for integrity verification."""
        serialized = json.dumps(data, sort_keys=True)
        return hashlib.sha256(serialized.encode()).hexdigest()

    async def process_event(self, event_data: str):
        try:
            raw = json.loads(event_data)
            evt = PredatorEvent.from_dict(raw)

            # Prepare Audit Record
            audit_id = uuid.uuid4()
            payload = evt.context

            integrity_hash = self._compute_integrity_hash({
                "audit_id": str(audit_id),
                "event_type": evt.event_type,
                "payload": payload,
            })

            async with self.db_pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO audit_ledger (audit_id, actor_id, action_type, resource_id, payload, trace_id, integrity_hash)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """,
                    audit_id,
                    evt.source,
                    evt.event_type,
                    str(evt.event_id),
                    json.dumps(payload),
                    uuid.UUID(evt.trace_id) if evt.trace_id else None,
                    integrity_hash,
                )

            logger.info(f"Audited event {evt.event_type} | ID: {audit_id}")

        except Exception as e:
            logger.exception(f"Audit processing failed: {e}")

    async def run(self):
        await self.connect()
        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe("predator-events")

        logger.info("Listening for events on channel 'predator-events'...")

        async for message in pubsub.listen():
            if message["type"] == "message":
                await self.process_event(message["data"])


if __name__ == "__main__":
    worker = AuditWorker()
    asyncio.run(worker.run())
