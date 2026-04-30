"""Predator v55.0 — API v2: Decision Artifacts (WORM ledger)."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, Query

from app.core.db import get_db
from app.models.v55.decision_artifact import (
    DecisionArtifactCreate,
    DecisionArtifactListResponse,
    DecisionArtifactResponse,
)
from app.repositories.decision_repository import DecisionRepository

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("predator.api.v2.decisions")
router = APIRouter(prefix="/decisions", tags=["v2-decisions"])


@router.post(
    "/",
    response_model=DecisionArtifactResponse,
    status_code=201,
    summary="Зафіксувати рішення (WORM)",
)
async def record_decision(
    body: DecisionArtifactCreate,
    db: AsyncSession = Depends(get_db),
) -> DecisionArtifactResponse:
    """Record a decision artifact. Once written, it cannot be modified or deleted."""
    repo = DecisionRepository(db)
    artifact = await repo.create_artifact(body)

    return DecisionArtifactResponse(
        decision_id=str(artifact.decision_id),
        timestamp=artifact.timestamp,
        decision_type=artifact.decision_type,
        tenant_id=artifact.tenant_id,
        trace_id=artifact.trace_id,
        input_fingerprint=artifact.input_fingerprint,
        model_fingerprint=artifact.model_fingerprint,
        output_fingerprint=artifact.output_fingerprint,
        confidence_score=artifact.confidence_score,
        explanation=artifact.explanation,
        sources=artifact.sources,
        metadata=artifact.metadata_,
    )


@router.get(
    "/",
    response_model=DecisionArtifactListResponse,
    summary="Список рішень",
)
async def list_decisions(
    decision_type: str | None = Query(None),
    trace_id: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> DecisionArtifactListResponse:
    """List decision artifacts with optional filters."""
    repo = DecisionRepository(db)
    results = await repo.search(
        decision_type=decision_type,
        trace_id=trace_id,
        limit=limit,
        offset=offset,
    )

    items = [
        DecisionArtifactResponse(
            decision_id=str(r.decision_id),
            timestamp=r.timestamp,
            decision_type=r.decision_type,
            tenant_id=r.tenant_id,
            trace_id=r.trace_id,
            input_fingerprint=r.input_fingerprint,
            model_fingerprint=r.model_fingerprint,
            output_fingerprint=r.output_fingerprint,
            confidence_score=r.confidence_score,
            explanation=r.explanation,
            sources=r.sources,
            metadata=r.metadata_,
        ) for r in results
    ]

    return DecisionArtifactListResponse(
        total=len(items),  # Full count would need a separate count query
        items=items,
    )
