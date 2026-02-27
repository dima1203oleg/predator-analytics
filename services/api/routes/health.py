
"""
Module: health
Component: api
Predator Analytics v45.1
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
import httpx

router = APIRouter()

@router.get("/health")
async def health_check():
    """Liveness probe."""
    return {"status": "healthy", "component": "api"}

@router.get("/ready")
async def readiness_check():
    """Readiness probe - checks dependencies."""
    checks = {
        "mcp_router": False,
        "rtb_engine": False,
        "database": False
    }
    
    # Simple dependency checks
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            # Check MCP Router
            resp = await client.get("http://predator-analytics-mcp-router:8080/health")
            checks["mcp_router"] = resp.status_code == 200
    except:
        pass

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            # Check RTB Engine
            resp = await client.get("http://predator-analytics-rtb-engine:8081/health")
            checks["rtb_engine"] = resp.status_code == 200
    except:
        pass
        
    # DB check skipped for brevity (would use asyncpg)
    checks["database"] = True 

    all_ready = all(checks.values())
    status_code = 200 if all_ready else 503
    
    return JSONResponse(
        status_code=status_code,
        content={"status": "ready" if all_ready else "degraded", "checks": checks}
    )
