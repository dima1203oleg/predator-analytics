"""UA Sources V1 API"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/ua-sources", tags=["UA Sources"])


@router.get("/status")
async def get_status():
    """Get UA Sources status"""
    return {
        "status": "OPERATIONAL",
        "sources": {
            "prozorro": "ACTIVE",
            "edr": "ACTIVE",
            "nbu": "ACTIVE"
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/search")
async def search(q: str, sources: str = "all"):
    """Search across UA sources"""
    return {"query": q, "results": []}
