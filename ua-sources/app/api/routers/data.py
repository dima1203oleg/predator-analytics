"""Data Router"""
from fastapi import APIRouter

router = APIRouter(prefix="/data", tags=["Data"])


@router.get("/sources")
async def list_sources():
    """List data sources"""
    return ["prozorro", "edr", "nbu", "tax", "customs"]


@router.get("/stats")
async def get_data_stats():
    """Get data statistics"""
    return {"total_records": 0, "last_update": None}
