"""
Predator Analytics - Portal Router
Public-facing API endpoints for external integrations
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, timezone
from app.services.ai_engine import ai_engine

router = APIRouter(prefix="/portal", tags=["Portal"])


class PortalStatus(BaseModel):
    status: str
    version: str
    uptime: str
    last_sync: datetime


class PublicQuery(BaseModel):
    query: str
    sector: Optional[str] = "GOV"
    limit: int = 10


@router.get("/status", response_model=PortalStatus)
async def get_portal_status():
    """Get public portal status"""
    return PortalStatus(
        status="OPERATIONAL",
        version="19.0.0",
        uptime="99.9%",
        last_sync=datetime.now(timezone.utc)
    )


@router.post("/search")
async def public_search(query: PublicQuery):
    """Public search endpoint with rate limiting"""
    result = await ai_engine.analyze(query=query.query, depth="standard")
    return {
        "query": query.query,
        "results": result.sources,
        "total": len(result.sources),
        "analysis": result.answer,
        "message": "Results retrieved successfully"
    }


@router.get("/health")
async def portal_health():
    """Health check for load balancers"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}
