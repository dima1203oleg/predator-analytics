"""Predator v55.0 — API v2: Analytics (CERS, Indices, Signals)."""

from __future__ import annotations

from datetime import UTC, datetime
import logging

from fastapi import APIRouter, HTTPException, Path, Query

from app.engines.cers import calculate_cers
from app.models.v55.cers import CERSHistoryResponse, CERSResponse


logger = logging.getLogger("predator.api.v2.analytics")
router = APIRouter(prefix="/analytics", tags=["v2-analytics"])


@router.get(
    "/cers/{ueid}",
    response_model=CERSResponse,
    summary="Отримати CERS для суб'єкта",
)
async def get_cers(
    ueid: str = Path(description="UEID суб'єкта"),
) -> CERSResponse:
    """Get current CERS score for an entity.

    If no pre-computed score exists, returns 404.
    Use POST /analytics/cers/calculate to compute on-demand.
    """
    # TODO: fetch from DB
    raise HTTPException(status_code=404, detail="CERS для цього суб'єкта ще не обчислено")


@router.post(
    "/cers/calculate",
    response_model=CERSResponse,
    summary="Обчислити CERS для суб'єкта",
)
async def calculate_cers_endpoint(
    ueid: str,
    behavioral: float = 50.0,
    institutional: float = 50.0,
    influence: float = 50.0,
    structural: float | None = None,
    predictive: float | None = None,
) -> CERSResponse:
    """Calculate CERS on-demand for an entity with provided layer scores."""
    result = calculate_cers(
        ueid=ueid,
        behavioral=behavioral,
        institutional=institutional,
        influence=influence,
        structural=structural,
        predictive=predictive,
    )

    return CERSResponse(
        ueid=result.ueid,
        score=result.score,
        level=result.level,
        level_ua=result.level_ua,
        level_en=result.level_en,
        components=result.components,
        weights=result.weights_used,
        confidence=result.confidence.total,
        decorrelation_applied=result.decorrelation_applied,
        calculated_at=datetime.now(UTC),
    )


@router.get(
    "/cers/{ueid}/history",
    response_model=CERSHistoryResponse,
    summary="Історія CERS для суб'єкта",
)
async def get_cers_history(
    ueid: str = Path(description="UEID суб'єкта"),
    days: int = Query(90, ge=1, le=365, description="Кількість днів"),
) -> CERSHistoryResponse:
    """Get CERS score history for an entity."""
    # TODO: fetch from DB
    return CERSHistoryResponse(
        ueid=ueid,
        history=[],
        trend="stable",
        trend_ua="Стабільний",
    )


@router.get(
    "/indices/{ueid}",
    summary="Всі індекси для суб'єкта",
)
async def get_all_indices(
    ueid: str = Path(description="UEID суб'єкта"),
) -> dict:
    """Get all calculated indices for an entity."""
    # TODO: fetch from DB
    return {
        "ueid": ueid,
        "indices": {},
        "message": "Індекси ще не обчислені для цього суб'єкта",
    }
