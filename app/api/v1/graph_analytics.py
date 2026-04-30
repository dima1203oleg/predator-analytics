"""Graph Service API (Phase 9 — SM Edition).

Endpoints for Graph Analysis, Communities, and Centrality.
"""
from typing import Any

from fastapi import APIRouter

from app.services.graph_engine import CentralityEngine, CommunityDetection

router = APIRouter(prefix="/graph-v2", tags=["Graph Service & Analytics"])

_community = CommunityDetection()
_centrality = CentralityEngine()


@router.post("/clustering/run")
async def run_community_detection() -> dict[str, Any]:
    """Запустити алгоритм Louvain."""
    return _community.run_clustering()


@router.get("/community/{ueid}")
async def get_node_community(ueid: str) -> dict[str, Any]:
    """Отримати дані про ком'юніті компанії."""
    return _community.get_community_info(ueid)


@router.get("/centrality/{ueid}")
async def get_centrality(ueid: str) -> dict[str, Any]:
    """Отримати метрики центральності (PageRank, Betweenness)."""
    return _centrality.calculate_centrality(ueid)


@router.post("/influence/{ueid}")
async def calculate_influence(
    ueid: str,
    eigenvector: float = 0.5,
    betweenness: float = 0.5,
    market_share: float = 0.5,
    reg_proximity: float = 0.5,
) -> dict[str, Any]:
    """Розрахувати Influence Mass (IM) для вузла."""
    result = _centrality.calculate_influence_mass(
        eigenvector, betweenness, market_share, reg_proximity
    )
    result["ueid"] = ueid
    return result
