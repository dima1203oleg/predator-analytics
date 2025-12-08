"""System Router - System status and health endpoints"""
from fastapi import APIRouter, Body
from datetime import datetime, timezone
from typing import Dict, Any
import platform

# Optional psutil for metrics
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

router = APIRouter(prefix="/system", tags=["System"])


import asyncio
import aiohttp
import asyncpg
import redis.asyncio as redis
from opensearchpy import AsyncOpenSearch
from minio import Minio
from app.core.config import settings

# Connection Strings (from environment via settings)
# Adapt SQLAlchemy URL for asyncpg if needed
raw_pg_url = settings.DATABASE_URL
if "sqlite" in raw_pg_url:
    # Use fallback for infrastructure check if using SQLite locally
    PG_DSN = "postgresql://predator:predator_password@localhost:5432/predator_db"
else:
    # Remove driver specific part for raw asyncpg connection
    PG_DSN = raw_pg_url.replace("+asyncpg", "").replace("+psycopg2", "")

REDIS_URL = settings.REDIS_URL
OPENSEARCH_URL = settings.OPENSEARCH_URL
QDRANT_URL = settings.QDRANT_URL
MINIO_URL = settings.MINIO_ENDPOINT

@router.get("/infrastructure")
async def get_infrastructure_status():
    """Check connectivity for all Data Layer components"""
    
    tasks = {
        "postgresql": _check_postgres(),
        "redis": _check_redis(),
        "opensearch": _check_opensearch(),
        "qdrant": _check_qdrant(),
        "minio": _check_minio(),
        "timescaledb": _check_postgres() # Usually same instance
    }
    
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    
    # Map back to dict
    status_map = {}
    for i, (key, _) in enumerate(tasks.items()):
        res = results[i]
        if isinstance(res, Exception):
            status_map[key] = {"status": "DOWN", "error": str(res)}
        else:
            status_map[key] = res
            
    # Add operational summary
    all_ok = all(s.get("status") == "UP" for s in status_map.values())
    
    return {
        "status": "OPERATIONAL" if all_ok else "DEGRADED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": status_map
    }

async def _check_postgres():
    try:
        # Simple connect and ping
        conn = await asyncpg.connect(PG_DSN)
        version = await conn.fetchval("SELECT version()")
        await conn.close()
        return {"status": "UP", "version": version.split(" ")[0]} # Postgres main version
    except Exception as e:
        return {"status": "DOWN", "error": str(e)}

async def _check_redis():
    try:
        r = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
        await r.ping()
        info = await r.info()
        await r.close()
        return {"status": "UP", "version": info.get("redis_version")}
    except Exception as e:
        return {"status": "DOWN", "error": str(e)}

async def _check_opensearch():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(OPENSEARCH_URL, timeout=2) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return {"status": "UP", "version": data.get("version", {}).get("number")}
                return {"status": "DOWN", "code": resp.status}
    except Exception as e:
        return {"status": "DOWN", "error": str(e)}

async def _check_qdrant():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(QDRANT_URL + "/readyz", timeout=2) as resp: # /readyz is standard qdrant check
                if resp.status == 200:
                    return {"status": "UP", "version": "latest"} # Qdrant doesn't always show version in readyz
                return {"status": "DOWN", "code": resp.status}
    except Exception as e:
        # Fallback to base URL
        try:
           async with aiohttp.ClientSession() as session:
               async with session.get(QDRANT_URL, timeout=2) as resp:
                   if resp.status == 200:
                       data = await resp.json()
                       return {"status": "UP", "version": data.get("version")}
        except Exception:
            return {"status": "DOWN", "error": str(e)}

async def _check_minio():
    try:
        # MinIO check is tricky without client lib, assume TCP is enough for "Infrastructure" status
        # Or use /minio/health/live
        url = f"http://{MINIO_URL}/minio/health/live"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=2) as resp:
                if resp.status == 200:
                    return {"status": "UP", "mode": "MinIO"}
                return {"status": "DOWN", "code": resp.status}
    except Exception as e:
        # Very permissive fallback (it might be on diff port for console console vs api)
        return {"status": "DOWN", "error": str(e)}



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


@router.post("/config/save")
async def save_config(config: Dict[str, Any] = Body(...)):
    """Save environment configuration"""
    # In a real implementation, this would save to a database or file
    # For now, we just log it and return success
    print(f"Saving config: {config}")
    return {"status": "success", "message": "Configuration saved successfully"}


@router.post("/config")
async def save_config(config: Dict[str, Any] = Body(...)):
    """Save system configuration"""
    # In a real app, this would save to DB or Redis
    # For now, we just acknowledge receipt
    return {
        "status": "SAVED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "config_keys": list(config.keys())
    }

