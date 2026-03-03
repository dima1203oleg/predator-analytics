"""Predator v55 ORM Repository — Signals."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.v55.orm.signal import SignalORM


logger = logging.getLogger("predator.repo.signals")


class SignalRepository:
    """Repository for managing Signals in the v55 schema."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_signal(
        self,
        signal_type: str,
        topic: str,
        layer: str,
        ueid: str | None = None,
        score: float | None = None,
        confidence: float | None = None,
        summary: str | None = None,
        details: dict[str, Any] | None = None,
        sources: list[str] | None = None,
        trace_id: str | None = None,
    ) -> SignalORM:
        """Persist a new signal to the database."""
        parsed_ueid = uuid.UUID(ueid) if ueid else None

        signal = SignalORM(
            signal_type=signal_type,
            topic=topic,
            layer=layer,
            ueid=parsed_ueid,
            score=score,
            confidence=confidence,
            summary=summary,
            details=details or {},
            sources=sources or [],
            trace_id=trace_id,
        )

        self.session.add(signal)
        await self.session.flush()

        logger.info(
            "Signal persisted: %s [%s/%s] ueid=%s",
            signal.signal_id,
            signal.signal_type,
            signal.layer,
            ueid,
        )
        return signal

    async def get_by_id(self, signal_id: str | uuid.UUID) -> SignalORM | None:
        """Fetch single signal by ID."""
        parsed_uuid = uuid.UUID(str(signal_id)) if isinstance(signal_id, str) else signal_id
        stmt = select(SignalORM).where(SignalORM.signal_id == parsed_uuid)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def search(
        self,
        ueid: str | None = None,
        layer: str | None = None,
        signal_type: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[SignalORM], int]:
        """Search signals with optional filters. Returns (items, total_count)."""
        base_stmt = select(SignalORM)
        count_stmt = select(func.count()).select_from(SignalORM)

        if ueid:
            parsed_ueid = uuid.UUID(ueid)
            base_stmt = base_stmt.where(SignalORM.ueid == parsed_ueid)
            count_stmt = count_stmt.where(SignalORM.ueid == parsed_ueid)

        if layer:
            base_stmt = base_stmt.where(SignalORM.layer == layer)
            count_stmt = count_stmt.where(SignalORM.layer == layer)

        if signal_type:
            base_stmt = base_stmt.where(SignalORM.signal_type == signal_type)
            count_stmt = count_stmt.where(SignalORM.signal_type == signal_type)

        # Total count
        count_result = await self.session.execute(count_stmt)
        total = count_result.scalar_one()

        # Paginated results
        data_stmt = base_stmt.order_by(SignalORM.created_at.desc()).limit(limit).offset(offset)
        data_result = await self.session.execute(data_stmt)
        items = list(data_result.scalars().all())

        return items, total
