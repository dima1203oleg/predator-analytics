"""Clusters & Shadow Maps Router — PREDATOR Analytics v55.1 Ironclad.
"""
from typing import Any

from fastapi import APIRouter, HTTPException

from app.services.cartel_detector import CartelDetectorService
from app.services.shadow_map import ShadowMapService

router = APIRouter()

@router.get("/cartels")
async def get_cartel_communities(tenant_id: str = "default") -> list[dict[str, Any]]:
    """Пошук ком'юніті та груп для попередження картелів (Louvain)."""
    try:
        return await CartelDetectorService.detect_communities(tenant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cartel-rings")
async def get_cartel_rings(tenant_id: str = "default") -> list[dict[str, Any]]:
    """Пошук кілець (tender rings)."""
    try:
        return await CartelDetectorService.find_cartel_rings(tenant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shadow/{ueid}")
async def get_shadow_connections(ueid: str, tenant_id: str = "default", depth: int = 2) -> list[dict[str, Any]]:
    """Пошук прихованих (shadow) зв'язків."""
    try:
        return await ShadowMapService.get_shadow_connections(ueid, tenant_id, max_depth=depth)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shadow-cluster/{ueid}")
async def get_shadow_cluster(ueid: str, tenant_id: str = "default") -> dict[str, Any]:
    """Знаходження цілої тіньової мережі для графіка."""
    try:
        return await ShadowMapService.find_hidden_cluster(ueid, tenant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
