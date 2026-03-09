"""
Paths Router — PREDATOR Analytics v55.1 Ironclad.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.services.influence_path import InfluencePathService
from typing import Dict, Any, List

router = APIRouter()

@router.get("/influence")
async def get_influence_path(
    source_ueid: str,
    target_ueid: str,
    tenant_id: str = "default"  # In real API, retrieved via middleware
) -> List[Dict[str, Any]]:
    """Пошук найкоротшого шляху впливу."""
    try:
        paths = await InfluencePathService.find_shortest_influence(source_ueid, target_ueid, tenant_id)
        return paths
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weighted")
async def get_weighted_path(
    source_ueid: str,
    target_ueid: str,
    tenant_id: str = "default"
) -> List[Dict[str, Any]]:
    """Пошук вагового шляху (через % володіння)."""
    try:
        paths = await InfluencePathService.find_weighted_influence(source_ueid, target_ueid, tenant_id)
        return paths
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
