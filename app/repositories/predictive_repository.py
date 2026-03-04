"""Predator v55.0 — Predictive Repository.

Handles DB operations for PredictiveScoreORM.
"""

from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.predictive import PredictiveScore
from app.models.v55.orm.predictive_score import PredictiveScoreORM


logger = logging.getLogger("predator.repo.predictive")


class PredictiveRepository:
    """Repository for Predictive Engine scores."""

    def __init__(self, session: AsyncSession) -> None:
        """Inject async DB session."""
        self.session = session

    async def save_score(self, score: PredictiveScore) -> PredictiveScoreORM:
        """Persist a Predictive score to the database."""
        try:
            orm_obj = PredictiveScoreORM(
                ueid=UUID(score.ueid) if isinstance(score.ueid, str) else score.ueid,
                disappearance_risk=score.disappearance_risk,
                regulatory_intervention_risk=score.regulatory_intervention_risk,
                concentration_risk=score.concentration_risk,
                scheme_emergence_risk=score.scheme_emergence_risk,
                aggregate=score.aggregate,
                confidence=score.confidence.final_score,
            )
            self.session.add(orm_obj)
            await self.session.flush()

            logger.debug("Saved Predictive score for ueid=%s: agg=%.1f", score.ueid, score.aggregate)
            return orm_obj
        except Exception as e:
            logger.exception("Failed to save Predictive score for ueid=%s", score.ueid)
            raise e

    async def get_latest_score(self, ueid: str) -> PredictiveScoreORM | None:
        """Get the most recent Predictive score for a given UEID."""
        stmt = (
            select(PredictiveScoreORM)
            .where(PredictiveScoreORM.ueid == (UUID(ueid) if isinstance(ueid, str) else ueid))
            .order_by(PredictiveScoreORM.calculated_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
