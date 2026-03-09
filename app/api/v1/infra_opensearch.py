"""
OpenSearch Infrastructure API (Phase 2C — SM Edition).

Endpoints for OpenSearch cluster, indices, and statistics.
"""
from fastapi import APIRouter
from typing import Any

from app.services.infrastructure.search.opensearch_manager import OpenSearchInfraManager

router = APIRouter(prefix="/infra/search/opensearch", tags=["Infrastructure & Search"])

_mgr = OpenSearchInfraManager()


@router.get("/status")
async def get_opensearch_status() -> dict[str, Any]:
    """Стан OpenSearch кластера."""
    return _mgr.get_cluster_status()


@router.get("/indices")
async def list_opensearch_indices() -> list[str]:
    """Перелік OpenSearch індексів."""
    return _mgr.list_indices()


@router.get("/indices/{index_name}")
async def get_index_stats(index_name: str) -> dict[str, Any]:
    """Статистика індексу."""
    return _mgr.get_index_stats(index_name)
