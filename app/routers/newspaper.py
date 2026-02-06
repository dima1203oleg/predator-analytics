from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.newspaper_service import newspaper_service


router = APIRouter(prefix="/newspaper", tags=["premium"])

@router.get("/")
async def get_today_newspaper():
    """Get the latest Morning Brief."""
    try:
        return await newspaper_service.generate_brief()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
