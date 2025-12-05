"""Search Router"""
from fastapi import APIRouter, Query
from datetime import datetime

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/")
async def search(q: str = Query(...), limit: int = Query(20, le=100)):
    """Universal search"""
    return {"query": q, "results": [], "total": 0}


@router.get("/companies")
async def search_companies(q: str, limit: int = 20):
    """Search companies"""
    return {"query": q, "companies": [], "total": 0}


@router.get("/tenders")
async def search_tenders(q: str, limit: int = 20):
    """Search tenders"""
    return {"query": q, "tenders": [], "total": 0}
