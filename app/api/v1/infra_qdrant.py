"""
Qdrant Vector DB Infrastructure API (Phase 2E — SM Edition).

Endpoints for Qdrant collections and cluster status.
"""
from fastapi import APIRouter
from typing import Any

from app.services.infrastructure.databases.qdrant.qdrant_manager import QdrantInfraManager

router = APIRouter(prefix="/infra/db/qdrant", tags=["Infrastructure & Databases"])

_mgr = QdrantInfraManager()


@router.get("/status")
async def get_qdrant_status() -> dict[str, Any]:
    """Стан Qdrant."""
    return _mgr.get_cluster_status()


@router.get("/collections")
async def list_qdrant_collections() -> list[dict[str, Any]]:
    """Перелік Qdrant колекцій."""
    return _mgr.list_collections()


@router.get("/collections/{collection_name}")
async def get_collection_stats(collection_name: str) -> dict[str, Any]:
    """Статистика колекції."""
    return _mgr.get_collection_stats(collection_name)
