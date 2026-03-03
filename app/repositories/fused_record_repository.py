"""Predator v55 ORM Repository — Fused Records."""

from __future__ import annotations

import logging
from typing import Any
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.v55.orm.fused_record import FusedRecordORM


logger = logging.getLogger("predator.repo.fused_record")


class FusedRecordRepository:
    """Repository for managing FusedRecords in the v55 schema."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, record_id: str | uuid.UUID) -> FusedRecordORM | None:
        """Fetch FusedRecord by exact ID."""
        parsed_uuid = uuid.UUID(str(record_id)) if isinstance(record_id, str) else record_id
        stmt = select(FusedRecordORM).where(FusedRecordORM.record_id == parsed_uuid)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def save_record(
        self,
        ueid: str | uuid.UUID,
        source: str,
        raw_data: dict[str, Any],
        normalized_data: dict[str, Any],
        fingerprint: str,
        quality_score: float,
    ) -> FusedRecordORM:
        """Save a new FusedRecord.
        
        Returns:
            The created FusedRecordORM
        """
        parsed_ueid = uuid.UUID(str(ueid)) if isinstance(ueid, str) else ueid
        
        record = FusedRecordORM(
            ueid=parsed_ueid,
            source=source,
            raw_data=raw_data,
            normalized_data=normalized_data,
            fingerprint=fingerprint,
            quality_score=quality_score,
        )
        
        self.session.add(record)
        await self.session.flush()
        
        logger.debug(f"Saved fused record for UEID {ueid} from {source}")
        return record

    async def get_by_ueid(self, ueid: str | uuid.UUID, limit: int = 100) -> list[FusedRecordORM]:
        """Fetch all fused records for a given UEID."""
        parsed_ueid = uuid.UUID(str(ueid)) if isinstance(ueid, str) else ueid
        stmt = select(FusedRecordORM).where(FusedRecordORM.ueid == parsed_ueid).order_by(FusedRecordORM.created_at.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
