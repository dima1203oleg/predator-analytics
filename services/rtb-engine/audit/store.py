"""Module: store
Component: rtb-engine
Predator Analytics v45.1.
"""

import json
import logging
import os
from typing import TYPE_CHECKING

import asyncpg

if TYPE_CHECKING:
    from services.shared.decision import DecisionArtifact


logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")


class AuditStore:
    """Persists RTB decisions to the Audit Ledger (PostgreSQL).
    Section 3.2.2 of Spec.
    """

    def __init__(self, dsn: str | None = None):
        self.dsn = dsn or DATABASE_URL
        self.pool = None

    async def connect(self):
        if not self.pool:
            self.pool = await asyncpg.create_pool(self.dsn)
            logger.info("Audit Store connected to PostgreSQL")

    async def save(self, artifact: "DecisionArtifact"):
        """Saves a DecisionArtifact to the database."""
        if not self.pool:
            await self.connect()

        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO audit_ledger (
                        audit_id, actor_id, action_type, resource_id, payload, trace_id, integrity_hash
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """,
                    artifact.decision_id,
                    "rtb-engine",
                    artifact.action_type,
                    artifact.rule_id,
                    json.dumps(artifact.to_dict()),
                    artifact.correlation_id,
                    artifact.context_hash,  # Simplified hash usage
                )
            logger.debug(f"Audit record saved: {artifact.decision_id}")
        except Exception as e:
            logger.exception(f"Failed to save audit record: {e}")

    async def close(self):
        if self.pool:
            await self.pool.close()
