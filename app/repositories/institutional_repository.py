"""Predator v55.0 — Institutional Repository.

Handles DB operations for InstitutionalScoreORM.
"""

from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.institutional import InstitutionalScore
from app.models.v55.orm.institutional_score import InstitutionalScoreORM
from app.core.ueid import parse_ueid


logger = logging.getLogger("predator.repo.institutional")


class InstitutionalRepository:
    """Repository for Institutional Engine scores."""

    def __init__(self, session: AsyncSession) -> None:
        """Inject async DB session."""
        self.session = session

    async def save_score(self, score: InstitutionalScore) -> InstitutionalScoreORM:
        """Persist an Institutional score to the database."""
        try:
            orm_obj = InstitutionalScoreORM(
                ueid=parse_ueid(score.ueid),
                aai=score.aai,
                pls=score.pls,
                rdi=score.rdi,
                rsi=score.rsi,
                aggregate=score.aggregate,
                confidence=score.confidence.final_score,
            )
            self.session.add(orm_obj)
            await self.session.flush()

            logger.debug("Saved Institutional score for ueid=%s: agg=%.1f", score.ueid, score.aggregate)
            return orm_obj
        except Exception as e:
            logger.exception("Failed to save Institutional score for ueid=%s", score.ueid)
            raise e

    async def get_latest_for_ueid(self, ueid: str | UUID) -> InstitutionalScoreORM | None:
        """Get the most recent Institutional score for a given UEID."""
        parsed_ueid = parse_ueid(ueid)
        stmt = (
            select(InstitutionalScoreORM)
            .where(InstitutionalScoreORM.ueid == parsed_ueid)
            .order_by(InstitutionalScoreORM.calculated_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
