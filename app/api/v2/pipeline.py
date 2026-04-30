"""Predator v55.0 — API v2: Pipeline (full end-to-end processing)."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.db import get_db
from app.engines.pipeline import run_full_pipeline

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("predator.api.v2.pipeline")
router = APIRouter(prefix="/pipeline", tags=["v2-pipeline"])


class PipelineRequest(BaseModel):
    """Request to run the full analytical pipeline."""

    source: str = Field(
        description="Джерело даних: customs | tax | edr | court | tender | license | media | telegram"
    )
    entity_type: str = Field(
        default="company", description="Тип сутності: company | person | other"
    )
    records: list[dict[str, Any]] = Field(description="Масив сирих записів для обробки")


class PipelineResponse(BaseModel):
    """Pipeline execution result."""

    pipeline: str
    source: str
    unique_entities: int
    steps: dict[str, Any]


@router.post(
    "/run",
    response_model=PipelineResponse,
    summary="Запустити повний аналітичний пайплайн",
)
async def run_pipeline(
    body: PipelineRequest,
    db: AsyncSession = Depends(get_db),
) -> PipelineResponse:
    """Run the full pipeline: Data Fusion → Behavioral → CERS.

    Accepts raw data records, processes them through all analytical layers,
    and returns the computed risk scores for each entity discovered.
    """
    if not body.records:
        raise HTTPException(status_code=400, detail="Масив записів не може бути порожнім")

    if len(body.records) > 10_000:
        raise HTTPException(status_code=400, detail="Максимум 10 000 записів за один запит")

    valid_sources = {
        "customs",
        "tax",
        "edr",
        "court",
        "tender",
        "license",
        "media",
        "telegram",
        "energy",
        "logistics",
        "budget",
        "demographic",
    }
    if body.source not in valid_sources:
        raise HTTPException(
            status_code=400,
            detail=f"Невідоме джерело '{body.source}'. Допустимі: {sorted(valid_sources)}",
        )

    logger.info("Pipeline triggered: source=%s records=%d", body.source, len(body.records))

    result = await run_full_pipeline(
        db=db,
        records=body.records,
        source=body.source,
        entity_type=body.entity_type,
    )

    return PipelineResponse(
        pipeline=result["pipeline"],
        source=result["source"],
        unique_entities=result["unique_entities"],
        steps=result["steps"],
    )


@router.post(
    "/entity/{ueid}/rescore",
    summary="Перерахувати скори для конкретної сутності",
)
async def rescore_entity(
    ueid: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Re-run Behavioral + CERS scoring for a specific entity.

    Useful when new data has been added outside the pipeline, or for manual recalculations.
    """
    from app.engines.behavioral import process_entity as behavioral_process
    from app.engines.cers import process_entity as cers_process
    from app.engines.influence import process_entity as influence_process
    from app.engines.institutional import process_entity as institutional_process
    from app.engines.predictive import process_entity as predictive_process
    from app.engines.structural_gaps import process_entity as structural_process

    logger.info("Rescore triggered for ueid=%s", ueid)

    # Behavioral
    try:
        behav = await behavioral_process(ueid, db)
        behavioral_result = {
            "bvi": behav.bvi,
            "ass": behav.ass,
            "cp": behav.cp,
            "aggregate": behav.aggregate,
            "confidence": behav.confidence.total,
        }
    except Exception as e:
        logger.exception("Behavioral rescore failed for %s", ueid)
        raise HTTPException(status_code=500, detail=f"Behavioral scoring failed: {e}")

    # 2. Institutional
    try:
        inst = await institutional_process(ueid, db)
        institutional_result = {
            "aai": inst.aai,
            "pls": inst.pls,
            "aggregate": inst.aggregate,
            "confidence": inst.confidence.total,
        }
    except Exception as e:
        logger.exception("Institutional rescore failed for %s", ueid)
        institutional_result = {"error": str(e)}

    # 3. Influence
    try:
        infl = await influence_process(ueid, db)
        influence_result = {
            "im": infl.im,
            "hci": infl.hci,
            "aggregate": infl.aggregate,
            "confidence": infl.confidence.total,
        }
    except Exception as e:
        logger.exception("Influence rescore failed for %s", ueid)
        influence_result = {"error": str(e)}

    # 4. Structural Gaps
    try:
        struct = await structural_process(ueid, db)
        structural_result = {
            "mci": struct.mci,
            "tdi": struct.tdi,
            "aggregate": struct.aggregate,
            "confidence": struct.confidence.total,
        }
    except Exception as e:
        logger.exception("Structural rescore failed for %s", ueid)
        structural_result = {"error": str(e)}

    # 5. Predictive
    try:
        pred = await predictive_process(ueid, db)
        predictive_result = {
            "disappearance_risk": pred.disappearance_risk,
            "scheme_emergence_risk": pred.scheme_emergence_risk,
            "aggregate": pred.aggregate,
            "confidence": pred.confidence.total,
        }
    except Exception as e:
        logger.exception("Predictive rescore failed for %s", ueid)
        predictive_result = {"error": str(e)}

    # 6. CERS
    try:
        cers = await cers_process(ueid, db)
        cers_result = {
            "score": cers.score,
            "level": cers.level,
            "level_ua": cers.level_ua,
            "level_en": cers.level_en,
            "confidence": cers.confidence.total,
        }
    except Exception as e:
        logger.exception("CERS rescore failed for %s", ueid)
        raise HTTPException(status_code=500, detail=f"CERS scoring failed: {e}")

    return {
        "ueid": ueid,
        "behavioral": behavioral_result,
        "institutional": institutional_result,
        "influence": influence_result,
        "structural": structural_result,
        "predictive": predictive_result,
        "cers": cers_result,
        "status": "rescored",
    }
