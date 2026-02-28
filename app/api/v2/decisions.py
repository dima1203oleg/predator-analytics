"""Predator v55.0 — API v2: Decision Artifacts (WORM ledger)."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Query

from app.models.v55.decision_artifact import (
    DecisionArtifactCreate,
    DecisionArtifactListResponse,
    DecisionArtifactResponse,
)

logger = logging.getLogger("predator.api.v2.decisions")
router = APIRouter(prefix="/decisions", tags=["v2-decisions"])


@router.post(
    "/",
    response_model=DecisionArtifactResponse,
    status_code=201,
    summary="Зафіксувати рішення (WORM)",
)
async def record_decision(body: DecisionArtifactCreate) -> DecisionArtifactResponse:
    """Record a decision artifact. Once written, it cannot be modified or deleted."""
    # TODO: insert into decision_artifacts table (WORM)
    from datetime import UTC, datetime
    from uuid import uuid4

    return DecisionArtifactResponse(
        decision_id=str(uuid4()),
        timestamp=datetime.now(UTC),
        decision_type=body.decision_type,
        tenant_id=body.tenant_id,
        trace_id=body.trace_id,
        input_fingerprint=body.input_fingerprint,
        model_fingerprint=body.model_fingerprint,
        output_fingerprint=body.output_fingerprint,
        confidence_score=body.confidence_score,
        explanation=body.explanation,
        sources=body.sources,
        metadata=body.metadata,
    )


@router.get(
    "/",
    response_model=DecisionArtifactListResponse,
    summary="Список рішень",
)
async def list_decisions(
    decision_type: Optional[str] = Query(None),
    trace_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> DecisionArtifactListResponse:
    """List decision artifacts with optional filters."""
    # TODO: fetch from DB
    return DecisionArtifactListResponse(
        total=0,
        items=[],
    )
