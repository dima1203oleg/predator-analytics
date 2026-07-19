"""Dossier API Router — Ендпоїнти для Deep Intelligence Engine.

Забезпечує доступ до агрегованих досьє.
"""
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.services.osint.collectors.base import Classification, CompleteDossier, DossierQuery, EntityType
from app.services.osint.dossier_aggregator import DossierAggregator
from predator_common.logging import get_logger

logger = get_logger("routers.dossier")

router = APIRouter(
    prefix="/dossier",
    tags=["Deep Intelligence Engine"],
    responses={404: {"description": "Not found"}},
)

aggregator = DossierAggregator()


class DossierRequest(BaseModel):
    """Модель запиту на збір досьє."""
    entity_type: EntityType
    identifier: str
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    edrpou: str | None = None
    rnokpp: str | None = None
    address: str | None = None
    classification_levels: list[Classification] = [Classification.WHITE, Classification.GREY]
    collectors_override: list[str] | None = None


@router.post("/compile", response_model=CompleteDossier)
async def compile_dossier(request: DossierRequest):
    """
    Запускає процес збору повного досьє на об'єкт.
    Агрегує дані з усіх доступних джерел (WHITE/GREY/BLACK).
    """
    try:
        query = DossierQuery(
            entity_type=request.entity_type,
            identifier=request.identifier,
            name=request.name,
            email=request.email,
            phone=request.phone,
            edrpou=request.edrpou,
            rnokpp=request.rnokpp,
            address=request.address,
            classification_levels=request.classification_levels,
            collectors_override=request.collectors_override,
        )
        
        dossier = await aggregator.compile_dossier(query)
        return dossier
    except Exception as e:
        logger.error(f"Помилка компіляції досьє: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collectors", response_model=list[dict[str, Any]])
async def list_collectors():
    """
    Повертає список доступних збирачів даних та їхні параметри.
    """
    return aggregator.get_collectors_status()
