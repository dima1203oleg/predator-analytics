"""Predator v55.0 — Structural Repository.

Handles DB operations for StructuralScoreORM.
"""

from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.structural_gaps import StructuralScore
from app.models.v55.orm.structural_score import StructuralScoreORM


logger = logging.getLogger("predator.repo.structural")


class StructuralRepository:
    """Repository for Structural Gaps Engine scores."""

    def __init__(self, session: AsyncSession) -> None:
        """Inject async DB session."""
        self.session = session

    async def save_score(self, score: StructuralScore) -> StructuralScoreORM:
        """Persist a Structural score to the database."""
        try:
            orm_obj = StructuralScoreORM(
                ueid=UUID(score.ueid) if isinstance(score.ueid, str) else score.ueid,
                mci=score.mci,
                pfi=score.pfi,
                tdi=score.tdi,
                lgs=score.lgs,
                aggregate=score.aggregate,
                confidence=score.confidence.final_score,
            )
            self.session.add(orm_obj)
            await self.session.flush()

            logger.debug("Saved Structural score for ueid=%s: agg=%.1f", score.ueid, score.aggregate)
            return orm_obj
        except Exception as e:
            logger.exception("Failed to save Structural score for ueid=%s", score.ueid)
            raise e

    async def get_latest_score(self, ueid: str) -> StructuralScoreORM | None:
        """Get the most recent Structural score for a given UEID."""
        stmt = (
            select(StructuralScoreORM)
            .where(StructuralScoreORM.ueid == (UUID(ueid) if isinstance(ueid, str) else ueid))
            .order_by(StructuralScoreORM.calculated_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
