"""Predator v55 ORM Repository — CERS Scores."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.v55.orm.cers_score import CERSScoreORM
from app.engines.cers import CERSResult


logger = logging.getLogger("predator.repo.cers")


class CersRepository:
    """Repository for managing CERS Scores in the v55 schema."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def save_score(self, result: CERSResult) -> CERSScoreORM:
        """Persist a newly calculated CERSResult."""
        parsed_ueid = uuid.UUID(str(result.ueid))

        score_orm = CERSScoreORM(
            ueid=parsed_ueid,
            score=result.score,
            level=result.level,
            components=result.components,
            weights=result.weights_used,
            confidence=result.confidence.total,
            decorrelation_applied=result.decorrelation_applied,
        )

        self.session.add(score_orm)
        await self.session.flush()

        logger.info("Saved CERS for %s: %s (%s)", result.ueid, result.score, result.level)
        return score_orm

    async def get_latest_for_ueid(self, ueid: str | uuid.UUID) -> CERSScoreORM | None:
        """Fetch the most recent CERS score for a given UEID."""
        parsed_ueid = uuid.UUID(str(ueid)) if isinstance(ueid, str) else ueid

        stmt = (
            select(CERSScoreORM)
            .where(CERSScoreORM.ueid == parsed_ueid)
            .order_by(CERSScoreORM.calculated_at.desc())
            .limit(1)
        )

        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_history_for_ueid(
        self, ueid: str | uuid.UUID, days: int = 90
    ) -> list[CERSScoreORM]:
        """Fetch the history of CERS scores for the specified duration."""
        parsed_ueid = uuid.UUID(str(ueid)) if isinstance(ueid, str) else ueid
        threshold_date = datetime.now(UTC) - timedelta(days=days)

        stmt = (
            select(CERSScoreORM)
            .where(CERSScoreORM.ueid == parsed_ueid, CERSScoreORM.calculated_at >= threshold_date)
            .order_by(CERSScoreORM.calculated_at.asc())
        )

        result = await self.session.execute(stmt)
        return list(result.scalars().all())
