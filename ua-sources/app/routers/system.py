"""System Router - System status and health endpoints"""
from fastapi import APIRouter
from datetime import datetime, timezone
import platform

# Optional psutil for metrics
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/status")
async def get_system_status():
    """Get system status"""
    return {
        "status": "OPERATIONAL",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "python_version": platform.python_version(),
        "platform": platform.system()
    }


@router.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy"}


@router.get("/metrics")
async def get_metrics():
    """Get system metrics"""
    cpu, memory = 0, 0
    
    if PSUTIL_AVAILABLE:
        try:
            cpu = psutil.cpu_percent()
            memory = psutil.virtual_memory().percent
        except Exception:
            pass
    
    return {
        "cpu_percent": cpu,
        "memory_percent": memory,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

