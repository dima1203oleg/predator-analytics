"""Analytics Endpoints"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
async def get_summary():
    """Get analytics summary"""
    return {"total_companies": 0, "total_tenders": 0}
