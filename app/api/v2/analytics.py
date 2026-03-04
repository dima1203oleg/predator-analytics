"""Predator v55.0 — API v2: Analytics (CERS, Indices, Signals)."""

from __future__ import annotations

from datetime import UTC, datetime
import logging

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.signal_bus import SignalBus
from app.engines.cers import calculate_cers
from app.models.v55.cers import CERSHistoryItem, CERSHistoryResponse, CERSResponse
from app.models.v55.signal import SignalLayer, SignalPriority, V55Signal
from app.models.v55.decision_artifact import DecisionArtifactCreate
from app.repositories.cers_repository import CersRepository
from app.repositories.decision_repository import DecisionRepository


logger = logging.getLogger("predator.api.v2.analytics")
router = APIRouter(prefix="/analytics", tags=["v2-analytics"])


@router.get(
    "/cers/{ueid}",
    response_model=CERSResponse,
    summary="Отримати CERS для суб'єкта",
)
async def get_cers(
    ueid: str = Path(description="UEID суб'єкта"),
    db: AsyncSession = Depends(get_db),
) -> CERSResponse:
    """Get current CERS score for an entity.

    If no pre-computed score exists, returns 404.
    Use POST /analytics/cers/calculate to compute on-demand.
    """
    repo = CersRepository(db)
    score_orm = await repo.get_latest_for_ueid(ueid)

    if not score_orm:
        raise HTTPException(status_code=404, detail="CERS для цього суб'єкта ще не обчислено")

    # We must construct a valid i18n label for the stored level, or fallback
    from app.core.i18n import get_cers_label

    level_ua = get_cers_label(score_orm.level, "uk")
    level_en = get_cers_label(score_orm.level, "en")

    return CERSResponse(
        ueid=str(score_orm.ueid),
        score=score_orm.score,
        level=score_orm.level,
        level_ua=level_ua,
        level_en=level_en,
        components=score_orm.components,
        weights=score_orm.weights,
        confidence=score_orm.confidence,
        decorrelation_applied=score_orm.decorrelation_applied,
        calculated_at=score_orm.calculated_at,
    )


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
    db: AsyncSession = Depends(get_db),
) -> CERSResponse:
    """Calculate CERS on-demand for an entity with provided layer scores.
    Persists the score, records a WORM decision, and emits to SignalBus.
    """
    result = calculate_cers(
        ueid=ueid,
        behavioral=behavioral,
        institutional=institutional,
        influence=influence,
        structural=structural,
        predictive=predictive,
    )

    cers_repo = CersRepository(db)
    decision_repo = DecisionRepository(db)

    # 1. Save to cers_scores table
    score_orm = await cers_repo.save_score(result)

    # 2. Record WORM decision artifact
    import json
    import hashlib

    input_data = {
        "behavioral": behavioral,
        "institutional": institutional,
        "influence": influence,
        "structural": structural,
        "predictive": predictive,
    }
    input_fp = hashlib.sha256(json.dumps(input_data, sort_keys=True).encode("utf-8")).hexdigest()
    output_fp = hashlib.sha256(f"{result.score}:{result.level}".encode("utf-8")).hexdigest()

    artifact = DecisionArtifactCreate(
        decision_type="cers",
        input_fingerprint=input_fp,
        model_fingerprint="CERS_V1",
        output_fingerprint=output_fp,
        confidence_score=result.confidence.total,
        explanation={
            "score": result.score,
            "level": result.level,
            "components": result.components,
            "weights": result.weights_used,
        },
        sources=["app.engines.cers"],
        metadata={"ueid": ueid},
    )
    await decision_repo.create_artifact(artifact)

    # 3. Emit to SignalBus
    bus = SignalBus.get_instance()
    signal = V55Signal(
        signal_type="CERS_MANUAL_CALC",
        topic="cers.updated",
        ueid=ueid,
        layer=SignalLayer.META,
        priority=SignalPriority.CRITICAL if result.score > 80 else SignalPriority.HIGH if result.score > 60 else SignalPriority.ROUTINE,
        score=result.score,
        confidence=result.confidence.total,
        summary=f"Ручне обчислення CERS: {result.score} ({result.level_ua})",
        metadata={
            "level": result.level,
            "components": result.components,
        }
    )
    await bus.emit(signal, session=db)

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
        calculated_at=score_orm.calculated_at,
    )


@router.get(
    "/cers/{ueid}/history",
    response_model=CERSHistoryResponse,
    summary="Історія CERS для суб'єкта",
)
async def get_cers_history(
    ueid: str = Path(description="UEID суб'єкта"),
    days: int = Query(90, ge=1, le=365, description="Кількість днів"),
    db: AsyncSession = Depends(get_db),
) -> CERSHistoryResponse:
    """Get CERS score history for an entity."""
    repo = CersRepository(db)
    history_orms = await repo.get_history_for_ueid(ueid, days=days)

    items = []
    from app.core.i18n import get_cers_label

    for row in history_orms:
        items.append(
            CERSHistoryItem(
                score=row.score,
                level=row.level,
                level_ua=get_cers_label(row.level, "uk"),
                level_en=get_cers_label(row.level, "en"),
                confidence=row.confidence,
                calculated_at=row.calculated_at,
            )
        )

    trend = "stable"
    trend_ua = "Стабільний"

    if len(items) >= 2:
        oldest = items[0].score
        newest = items[-1].score
        if newest > oldest + 5.0:
            trend = "increasing"
            trend_ua = "Зростає риска"
        elif newest < oldest - 5.0:
            trend = "decreasing"
            trend_ua = "Зменшується ризик"

    return CERSHistoryResponse(
        ueid=ueid,
        history=items,
        trend=trend,
        trend_ua=trend_ua,
    )


@router.get(
    "/indices/{ueid}",
    summary="Всі індекси для суб'єкта",
)
async def get_all_indices(
    ueid: str = Path(description="UEID суб'єкта"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get all calculated indices for an entity."""
    from app.repositories.behavioral_repository import BehavioralRepository
    from app.repositories.institutional_repository import InstitutionalRepository
    from app.repositories.influence_repository import InfluenceRepository
    from app.repositories.structural_repository import StructuralRepository
    from app.repositories.predictive_repository import PredictiveRepository

    indices = {}
    
    # 1. Behavioral
    behav_repo = BehavioralRepository(db)
    b_score = await behav_repo.get_latest_for_ueid(ueid)
    if b_score:
        indices["behavioral"] = {
            "aggregate": b_score.aggregate,
            "bvi": b_score.bvi,
            "ass": b_score.ass,
            "cp": b_score.cp,
            "confidence": b_score.confidence,
            "calculated_at": b_score.calculated_at.isoformat() if b_score.calculated_at else None,
        }

    # 2. Institutional
    inst_repo = InstitutionalRepository(db)
    i_score = await inst_repo.get_latest_for_ueid(ueid)
    if i_score:
        indices["institutional"] = {
            "aggregate": i_score.aggregate,
            "aai": i_score.aai,
            "pls": i_score.pls,
            "confidence": i_score.confidence,
            "calculated_at": i_score.calculated_at.isoformat() if i_score.calculated_at else None,
        }

    # 3. Influence
    infl_repo = InfluenceRepository(db)
    inf_score = await infl_repo.get_latest_for_ueid(ueid)
    if inf_score:
        indices["influence"] = {
            "aggregate": inf_score.aggregate,
            "im": inf_score.im,
            "hci": inf_score.hci,
            "confidence": inf_score.confidence,
            "calculated_at": inf_score.calculated_at.isoformat() if inf_score.calculated_at else None,
        }

    # 4. Structural
    struct_repo = StructuralRepository(db)
    s_score = await struct_repo.get_latest_for_ueid(ueid)
    if s_score:
        indices["structural"] = {
            "aggregate": s_score.aggregate,
            "mci": s_score.mci,
            "tdi": s_score.tdi,
            "confidence": s_score.confidence,
            "calculated_at": s_score.calculated_at.isoformat() if s_score.calculated_at else None,
        }

    # 5. Predictive
    pred_repo = PredictiveRepository(db)
    p_score = await pred_repo.get_latest_for_ueid(ueid)
    if p_score:
        indices["predictive"] = {
            "aggregate": p_score.aggregate,
            "disappearance_risk": p_score.disappearance_risk,
            "scheme_emergence_risk": p_score.scheme_emergence_risk,
            "confidence": p_score.confidence,
            "calculated_at": p_score.calculated_at.isoformat() if p_score.calculated_at else None,
        }

    if not indices:
        return {
            "ueid": ueid,
            "indices": {},
            "message": "Індекси ще не обчислені для цього суб'єкта",
        }

    return {
        "ueid": ueid,
        "indices": indices,
    }
