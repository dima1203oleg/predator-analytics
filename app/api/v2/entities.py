"""Predator v55.0 — API v2: Entities (UEID management)."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.core.ueid import (
    UEIDResult,
    generate_deterministic_ueid,
    generate_ueid,
    normalize_name,
    validate_edrpou,
)
from app.models.v55.ueid import (
    EntityCreate,
    EntityResponse,
    EntitySearchRequest,
    EntitySearchResponse,
)

logger = logging.getLogger("predator.api.v2.entities")
router = APIRouter(prefix="/entities", tags=["v2-entities"])


@router.post("/resolve", response_model=EntityResponse, summary="Резолюція або створення суб'єкта")
async def resolve_entity(body: EntityCreate) -> EntityResponse:
    """Resolve an entity to its UEID, or create a new one.

    Uses EDRPOU for exact match, name for fuzzy match.
    """
    name_normalized = normalize_name(body.name)

    # Determine UEID
    if body.edrpou and validate_edrpou(body.edrpou):
        ueid = generate_deterministic_ueid(body.edrpou)
        is_new = False  # TODO: check DB
    else:
        ueid = generate_ueid()
        is_new = True

    logger.info("Entity resolved: ueid=%s name=%s edrpou=%s is_new=%s",
                ueid, name_normalized, body.edrpou, is_new)

    return EntityResponse(
        ueid=ueid,
        entity_type=body.entity_type,
        name=body.name,
        name_normalized=name_normalized,
        edrpou=body.edrpou,
        inn=body.inn,
        metadata=body.metadata,
        is_new=is_new,
    )


@router.get("/{ueid}", response_model=EntityResponse, summary="Отримати суб'єкт за UEID")
async def get_entity(ueid: str) -> EntityResponse:
    """Get entity by UEID."""
    # TODO: implement DB lookup
    raise HTTPException(status_code=404, detail="Суб'єкт не знайдений")


@router.get("/", response_model=EntitySearchResponse, summary="Пошук суб'єктів")
async def search_entities(
    q: str = Query(..., min_length=1, description="Пошуковий запит"),
    entity_type: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> EntitySearchResponse:
    """Search entities by name or EDRPOU."""
    # TODO: implement search via PostgreSQL/OpenSearch
    return EntitySearchResponse(
        total=0,
        items=[],
        query=q,
    )
