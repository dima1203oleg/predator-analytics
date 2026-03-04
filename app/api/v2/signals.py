"""Predator v55.0 — API v2: Signals stream."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.v55.signal import SignalListResponse, SignalResponse
from app.repositories.signal_repository import SignalRepository


logger = logging.getLogger("predator.api.v2.signals")
router = APIRouter(prefix="/signals", tags=["v2-signals"])


# ─── i18n helpers ───
SIGNAL_TYPE_UA = {
    "anomaly": "Аномалія",
    "alert": "Сповіщення",
    "warning": "Попередження",
    "info": "Інформація",
    "prediction": "Прогноз",
    "pattern": "Паттерн",
    "ENTITY_CREATED": "Суб'єкт створений",
    "DATA_INGESTED": "Запис імпортовано",
    "CERS_MANUAL_CALC": "Ручне обчислення CERS",
    "SCORE_UPDATED": "Оцінка оновлена",
}
LAYER_UA = {
    "fusion": "Злиття даних",
    "behavioral": "Поведінковий",
    "institutional": "Інституційний",
    "influence": "Впливу",
    "structural": "Структурний",
    "predictive": "Прогностичний",
    "meta": "Мета-оцінка (CERS)",
    "graph": "Графовий аналіз",
}


@router.get(
    "/",
    response_model=SignalListResponse,
    summary="Потік сигналів",
)
async def list_signals(
    ueid: str | None = Query(None, description="Фільтр за UEID"),
    layer: str | None = Query(
        None, description="behavioral | institutional | influence | structural | predictive"
    ),
    signal_type: str | None = Query(
        None, description="anomaly | alert | warning | info | prediction"
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> SignalListResponse:
    """Get paginated list of signals with optional filters."""
    repo = SignalRepository(db)
    offset = (page - 1) * page_size

    items_orm, total = await repo.search(
        ueid=ueid,
        layer=layer,
        signal_type=signal_type,
        limit=page_size,
        offset=offset,
    )

    items = [
        SignalResponse(
            signal_id=str(s.signal_id),
            signal_type=s.signal_type,
            signal_type_ua=SIGNAL_TYPE_UA.get(s.signal_type, s.signal_type),
            topic=s.topic,
            ueid=str(s.ueid) if s.ueid else None,
            layer=s.layer,
            layer_ua=LAYER_UA.get(s.layer, s.layer),
            score=s.score or 0.0,
            confidence=s.confidence or 0.0,
            summary=s.summary or "",
            details=s.details or {},
            sources=s.sources or [],
            created_at=s.created_at,
        )
        for s in items_orm
    ]

    return SignalListResponse(
        total=total,
        items=items,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{signal_id}",
    response_model=SignalResponse,
    summary="Деталі сигналу",
)
async def get_signal(
    signal_id: str,
    db: AsyncSession = Depends(get_db),
) -> SignalResponse:
    """Get signal details by ID."""
    repo = SignalRepository(db)
    signal = await repo.get_by_id(signal_id)

    if not signal:
        raise HTTPException(status_code=404, detail="Сигнал не знайдений")

    return SignalResponse(
        signal_id=str(signal.signal_id),
        signal_type=signal.signal_type,
        signal_type_ua=SIGNAL_TYPE_UA.get(signal.signal_type, signal.signal_type),
        topic=signal.topic,
        ueid=str(signal.ueid) if signal.ueid else None,
        layer=signal.layer,
        layer_ua=LAYER_UA.get(signal.layer, signal.layer),
        score=signal.score or 0.0,
        confidence=signal.confidence or 0.0,
        summary=signal.summary or "",
        details=signal.details or {},
        sources=signal.sources or [],
        created_at=signal.created_at,
    )
