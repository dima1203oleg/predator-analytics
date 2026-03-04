"""Predator v55.0 — Influence Repository.

Handles DB operations for InfluenceScoreORM.
"""

from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.influence import InfluenceScore
from app.models.v55.orm.influence_score import InfluenceScoreORM
from app.core.ueid import parse_ueid


logger = logging.getLogger("predator.repo.influence")


class InfluenceRepository:
    """Repository for Influence Engine scores."""

    def __init__(self, session: AsyncSession) -> None:
        """Inject async DB session."""
        self.session = session

    async def save_score(self, score: InfluenceScore) -> InfluenceScoreORM:
        """Persist an Influence score to the database."""
        try:
            orm_obj = InfluenceScoreORM(
                ueid=parse_ueid(score.ueid),
                im=score.im,
                hci=score.hci,
                shadow_cluster_score=score.shadow_cluster_score,
                aggregate=score.aggregate,
                confidence=score.confidence.final_score,
            )
            self.session.add(orm_obj)
            await self.session.flush()

            logger.debug("Saved Influence score for ueid=%s: agg=%.1f", score.ueid, score.aggregate)
            return orm_obj
        except Exception as e:
            logger.exception("Failed to save Influence score for ueid=%s", score.ueid)
            raise e

    async def get_latest_for_ueid(self, ueid: str | UUID) -> InfluenceScoreORM | None:
        """Get the most recent Influence score for a given UEID."""
        parsed_ueid = parse_ueid(ueid)
        stmt = (
            select(InfluenceScoreORM)
            .where(InfluenceScoreORM.ueid == parsed_ueid)
            .order_by(InfluenceScoreORM.calculated_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
