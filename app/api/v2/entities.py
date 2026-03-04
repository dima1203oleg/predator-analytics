"""Predator v55.0 — API v2: Entities (UEID management)."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.v55.ueid import (
    EntityCreate,
    EntityResponse,
    EntitySearchResponse,
)
from app.repositories.entity_repository import EntityRepository

logger = logging.getLogger("predator.api.v2.entities")
router = APIRouter(prefix="/entities", tags=["v2-entities"])


@router.post("/resolve", response_model=EntityResponse, summary="Резолюція або створення суб'єкта")
async def resolve_entity(
    body: EntityCreate,
    db: AsyncSession = Depends(get_db),
) -> EntityResponse:
    """Resolve an entity to its UEID, or create a new one.

    Uses EDRPOU for exact match, or Name+Type fingerprint.
    """
    repo = EntityRepository(db)
    entity, is_new = await repo.resolve_or_create(
        name=body.name,
        entity_type=body.entity_type,
        edrpou=body.edrpou,
        inn=body.inn,
        metadata=body.metadata,
    )

    logger.info(
        "Entity resolved: ueid=%s name=%s edrpou=%s is_new=%s",
        entity.ueid,
        entity.name_normalized,
        entity.edrpou,
        is_new,
    )

    return EntityResponse(
        ueid=str(entity.ueid),
        entity_type=entity.entity_type,
        name=entity.name,
        name_normalized=entity.name_normalized,
        edrpou=entity.edrpou,
        inn=entity.inn,
        metadata=entity.metadata_,
        is_new=is_new,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
    )


@router.get("/{ueid}", response_model=EntityResponse, summary="Отримати суб'єкт за UEID")
async def get_entity(
    ueid: str,
    db: AsyncSession = Depends(get_db),
) -> EntityResponse:
    """Get entity by UEID."""
    repo = EntityRepository(db)
    entity = await repo.get_by_ueid(ueid)
    
    if not entity:
        raise HTTPException(status_code=404, detail="Суб'єкт не знайдений")
        
    return EntityResponse(
        ueid=str(entity.ueid),
        entity_type=entity.entity_type,
        name=entity.name,
        name_normalized=entity.name_normalized,
        edrpou=entity.edrpou,
        inn=entity.inn,
        metadata=entity.metadata_,
        is_new=False,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
    )


@router.get("/", response_model=EntitySearchResponse, summary="Пошук суб'єктів")
async def search_entities(
    q: str = Query(..., min_length=1, description="Пошуковий запит (назва або ЄДРПОУ)"),
    entity_type: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> EntitySearchResponse:
    """Search entities by name (fuzzy) or EDRPOU (exact)."""
    repo = EntityRepository(db)
    results, total = await repo.search(query=q, entity_type=entity_type, limit=limit, offset=offset)
    
    items = [
        EntityResponse(
            ueid=str(entity.ueid),
            entity_type=entity.entity_type,
            name=entity.name,
            name_normalized=entity.name_normalized,
            edrpou=entity.edrpou,
            inn=entity.inn,
            metadata=entity.metadata_,
            is_new=False,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        ) for entity in results
    ]
    
    return EntitySearchResponse(
        total=total,
        items=items,
        query=q,
    )
