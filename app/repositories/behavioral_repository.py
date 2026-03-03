"""Predator v55 ORM Repository — Behavioral Scores."""

from __future__ import annotations

import logging
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.v55.orm.behavioral_score import BehavioralScoreORM
from app.engines.behavioral import BehavioralScore


logger = logging.getLogger("predator.repo.behavioral")


class BehavioralRepository:
    """Repository for managing Behavioral Scores in the v55 schema."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def save_score(self, score: BehavioralScore) -> BehavioralScoreORM:
        """Persist a newly calculated BehavioralScore."""
        parsed_ueid = uuid.UUID(str(score.ueid))

        score_orm = BehavioralScoreORM(
            ueid=parsed_ueid,
            bvi=score.bvi,
            ass=score.ass,
            cp=score.cp,
            inertia_index=score.inertia_index,
            confidence=score.confidence.total,
        )

        self.session.add(score_orm)
        await self.session.flush()

        logger.info(
            "Saved Behavioral Score for %s: BVI=%.2f ASS=%.2f CP=%.2f",
            score.ueid,
            score.bvi,
            score.ass,
            score.cp,
        )
        return score_orm

    async def get_latest_for_ueid(self, ueid: str | uuid.UUID) -> Optional[BehavioralScoreORM]:
        """Fetch the most recent behavioral score for a given UEID."""
        parsed_ueid = uuid.UUID(str(ueid)) if isinstance(ueid, str) else ueid

        stmt = (
            select(BehavioralScoreORM)
            .where(BehavioralScoreORM.ueid == parsed_ueid)
            .order_by(BehavioralScoreORM.calculated_at.desc())
            .limit(1)
        )

        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
