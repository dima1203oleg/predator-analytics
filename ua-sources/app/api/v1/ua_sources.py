"""UA Sources V1 API"""
from fastapi import APIRouter
from datetime import datetime, timezone
from app.services.ai_engine import ai_engine

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
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/search")
async def search(q: str, sources: str = "all"):
    """Search across UA sources"""
    """Search across UA sources using AI Engine"""
    result = await ai_engine.analyze(query=q, depth="standard")
    return {
        "query": q,
        "results": result.sources,
        "analysis": result.answer,
        "confidence": result.confidence
    }
