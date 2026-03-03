"""Predator v55 ORM Repository — Decision Artifacts (WORM)."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.v55.decision_artifact import DecisionArtifactCreate
from app.models.v55.orm.decision_artifact import DecisionArtifactORM


logger = logging.getLogger("predator.repo.decisions")


class DecisionRepository:
    """Repository for managing immutable Decision Artifacts in the v55 schema."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_artifact(self, data: DecisionArtifactCreate) -> DecisionArtifactORM:
        """Create a new Decision Artifact (WORM).
        
        Note: The underlying PostgreSQL trigger guarantees this record cannot be updated or deleted.
        """
        artifact = DecisionArtifactORM(
            decision_type=data.decision_type,
            tenant_id=data.tenant_id,
            trace_id=data.trace_id,
            input_fingerprint=data.input_fingerprint,
            model_fingerprint=data.model_fingerprint,
            output_fingerprint=data.output_fingerprint,
            confidence_score=data.confidence_score,
            explanation=data.explanation,
            sources=data.sources,
            metadata_=data.metadata,
        )
        
        self.session.add(artifact)
        await self.session.flush()
        
        logger.info(
            "WORM: Recorded decision artifact %s (type=%s) with confidence %s",
            artifact.decision_id,
            artifact.decision_type,
            artifact.confidence_score,
        )
        
        return artifact
        
    async def get_by_id(self, decision_id: str | uuid.UUID) -> DecisionArtifactORM | None:
        """Fetch decision artifact by exact ID."""
        parsed_uuid = uuid.UUID(str(decision_id)) if isinstance(decision_id, str) else decision_id
        stmt = select(DecisionArtifactORM).where(DecisionArtifactORM.decision_id == parsed_uuid)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
        
    async def search(
        self,
        decision_type: str | None = None,
        trace_id: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[DecisionArtifactORM]:
        """List decision artifacts with optional filtering."""
        stmt = select(DecisionArtifactORM).order_by(DecisionArtifactORM.timestamp.desc())
        
        if decision_type:
            stmt = stmt.where(DecisionArtifactORM.decision_type == decision_type)
            
        if trace_id:
            stmt = stmt.where(DecisionArtifactORM.trace_id == trace_id)
            
        stmt = stmt.limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
