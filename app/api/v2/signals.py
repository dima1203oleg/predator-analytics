"""Predator v55.0 — API v2: Signals stream."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Query

from app.models.v55.signal import SignalListResponse


logger = logging.getLogger("predator.api.v2.signals")
router = APIRouter(prefix="/signals", tags=["v2-signals"])


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
) -> SignalListResponse:
    """Get paginated list of signals with optional filters."""
    # TODO: fetch from OpenSearch/PostgreSQL
    return SignalListResponse(
        total=0,
        items=[],
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{signal_id}",
    summary="Деталі сигналу",
)
async def get_signal(signal_id: str) -> dict:
    """Get signal details by ID."""
    # TODO: fetch from DB
    return {
        "signal_id": signal_id,
        "message": "Сигнал не знайдений",
    }
