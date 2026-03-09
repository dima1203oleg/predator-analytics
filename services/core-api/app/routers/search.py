"""
Search Router — PREDATOR Analytics v55.1 Ironclad.

Hybrid search (Full-text + Vector) for entities and documents.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from app.services.search_service import SearchService
from app.dependencies import PermissionChecker
from app.core.permissions import Permission

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/")
async def search_entities(
    q: str = Query(..., min_length=2),
    limit: int = 10,
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA]))
):
    """Гібридний пошук по всій системі."""
    return await SearchService.hybrid_search(q, limit)
