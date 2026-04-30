"""🔎 SEARCH — /api/v1/search
Canonical Hybrid Search (OpenSearch + Qdrant) for PREDATOR Analytics v4.2.0.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.services.search_fusion import hybrid_search_with_rrf

router = APIRouter(prefix="/search")

@router.get("")
async def global_search(
    q: str = Query(..., min_length=1, description="Пошуковий запит"),
    limit: int = Query(20, ge=1, le=100),
    tenant: str = Query("default"),
    index: str = Query("idx_staging_customs")
) -> dict[str, Any]:
    """Виконує глобальний гібридний пошук по всій системі.
    Об'єднує результати OpenSearch та Qdrant за допомогою алгоритму RRF.
    """
    try:
        results = await hybrid_search_with_rrf(
            query=q,
            limit=limit,
            tenant_id=tenant,
            index_name=index
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search operation failed: {e!s}")
