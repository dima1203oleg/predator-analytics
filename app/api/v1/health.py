"""
🚑 HEALTH — /api/v1/health
Canonical health checks for PREDATOR Analytics v4.2.0.
"""

from __future__ import annotations
import time
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.settings import get_settings

router = APIRouter(prefix="/health")
settings = get_settings()

@router.get("")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Check system health including database connectivity.
    """
    start_time = time.time()
    db_status = "UP"
    db_latency = 0.0
    
    try:
        db_start = time.time()
        await db.execute(text("SELECT 1"))
        db_latency = round(float((time.time() - db_start) * 1000), 2)
    except Exception as e:
        db_status = f"DOWN: {str(e)}"

    return {
        "status": "HEALTHY" if db_status == "UP" else "DEGRADED",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "services": {
            "database": {
                "status": db_status,
                "latency_ms": db_latency
            },
            "api": {
                "status": "UP",
                "uptime": "N/A" # In a real system, track this
            }
        },
        "timestamp": time.time(),
        "total_latency_ms": round(float((time.time() - start_time) * 1000), 2)
    }

@router.get("/ready")
async def readiness_probe():
    """
    Simple readiness probe for Kubernetes/Orchestration.
    """
    return {"status": "READY"}

@router.get("/live")
async def liveness_probe():
    """
    Simple liveness probe.
    """
    return {"status": "ALIVE"}
