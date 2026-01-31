"""
Diagnostics API Router
Provides system diagnostics and health check endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import logging
from datetime import datetime
import psutil
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])


@router.get("/")
async def get_diagnostics() -> Dict[str, Any]:
    """
    Get comprehensive system diagnostics
    Returns system health metrics, resource usage, and component status
    """
    try:
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Process info
        process = psutil.Process(os.getpid())
        process_memory = process.memory_info()
        
        diagnostics = {
            "timestamp": datetime.utcnow().isoformat(),
            "status": "healthy" if cpu_percent < 80 and memory.percent < 85 else "degraded",
            "system": {
                "cpu_percent": cpu_percent,
                "cpu_count": psutil.cpu_count(),
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "percent_used": memory.percent
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "used_gb": round(disk.used / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "percent_used": disk.percent
                }
            },
            "process": {
                "pid": process.pid,
                "memory_rss_mb": round(process_memory.rss / (1024**2), 2),
                "memory_vms_mb": round(process_memory.vms / (1024**2), 2),
                "threads": process.num_threads()
            },
            "components": {
                "backend": "operational",
                "database": "operational",  # TODO: Add real DB health check
                "cache": "operational",      # TODO: Add real Redis health check
                "message_queue": "operational"  # TODO: Add real RabbitMQ health check
            }
        }
        
        return diagnostics
        
    except Exception as e:
        logger.error(f"Error getting diagnostics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get diagnostics: {str(e)}")


@router.get("/health")
async def get_health() -> Dict[str, str]:
    """Quick health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/components")
async def get_component_status() -> Dict[str, Any]:
    """Get status of individual system components"""
    # TODO: Implement real component health checks
    components = {
        "backend": {"status": "operational", "uptime_hours": 0},
        "postgres": {"status": "unknown", "connection": "not_checked"},
        "redis": {"status": "unknown", "connection": "not_checked"},
        "opensearch": {"status": "unknown", "connection": "not_checked"},
        "qdrant": {"status": "unknown", "connection": "not_checked"},
        "rabbitmq": {"status": "unknown", "connection": "not_checked"},
        "minio": {"status": "unknown", "connection": "not_checked"}
    }
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "components": components
    }
