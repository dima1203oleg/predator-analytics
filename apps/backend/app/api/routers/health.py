"""
Health Check API for Predator Analytics
Comprehensive dependency checks for Kubernetes probes
"""
from fastapi import APIRouter, Response
from typing import Dict, Any, Optional
import asyncio
import logging
import time
from datetime import datetime
import os

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


async def check_postgres() -> Dict[str, Any]:
    """Check PostgreSQL connection"""
    try:
        from sqlalchemy import text
        from app.database import engine

        start = time.time()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency = (time.time() - start) * 1000

        return {
            "status": "healthy",
            "latency_ms": round(latency, 2)
        }
    except Exception as e:
        logger.error(f"PostgreSQL check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


async def check_redis() -> Dict[str, Any]:
    """Check Redis connection"""
    try:
        import redis.asyncio as aioredis

        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        start = time.time()

        redis = await aioredis.from_url(redis_url, socket_timeout=2)
        await redis.ping()
        await redis.close()

        latency = (time.time() - start) * 1000
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2)
        }
    except Exception as e:
        logger.error(f"Redis check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


async def check_qdrant() -> Dict[str, Any]:
    """Check Qdrant vector database and get point counts"""
    try:
        from qdrant_client import QdrantClient

        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        start = time.time()

        client = QdrantClient(url=qdrant_url, timeout=5)
        collections = client.get_collections().collections

        total_points = 0
        for col in collections:
            stats = client.get_collection(col.name)
            total_points += stats.points_count

        latency = (time.time() - start) * 1000
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "collections": len(collections),
            "vectors_count": total_points
        }
    except Exception as e:
        logger.error(f"Qdrant check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


async def check_opensearch() -> Dict[str, Any]:
    """Check OpenSearch connection and get document counts"""
    try:
        from opensearchpy import AsyncOpenSearch

        opensearch_url = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
        start = time.time()

        client = AsyncOpenSearch(
            hosts=[opensearch_url],
            use_ssl=False,
            verify_certs=False,
            timeout=5
        )
        info = await client.info()

        # Get total docs count
        stats = await client.indices.stats()
        total_docs = stats.get("_all", {}).get("primaries", {}).get("docs", {}).get("count", 0)

        await client.close()

        latency = (time.time() - start) * 1000
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "version": info.get("version", {}).get("number", "unknown"),
            "docs_count": total_docs
        }
    except Exception as e:
        logger.error(f"OpenSearch check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


async def check_llm_providers() -> Dict[str, Any]:
    """Quick check of LLM provider availability"""
    try:
        from app.services.llm_keys import get_key_manager

        manager = get_key_manager()
        available = manager.get_available_providers()
        status = manager.get_status()

        return {
            "status": "healthy" if available else "degraded",
            "available_providers": available,
            "total_providers": len(status)
        }
    except Exception as e:
        logger.error(f"LLM check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


@router.get("/health")
async def health_check():
    """
    Basic health check for Kubernetes liveness probe
    Returns 200 if service is running
    """
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@router.get("/health/ready")
async def readiness_check(response: Response):
    """
    Readiness check for Kubernetes readiness probe
    Checks all critical dependencies
    """
    # Run checks in parallel
    checks = await asyncio.gather(
        check_postgres(),
        check_redis(),
        return_exceptions=True
    )

    results = {
        "postgres": checks[0] if not isinstance(checks[0], Exception) else {"status": "error", "error": str(checks[0])},
        "redis": checks[1] if not isinstance(checks[1], Exception) else {"status": "error", "error": str(checks[1])}
    }

    # Determine overall status
    all_healthy = all(
        r.get("status") == "healthy"
        for r in results.values()
        if isinstance(r, dict)
    )

    if not all_healthy:
        response.status_code = 503

    return {
        "status": "ready" if all_healthy else "not_ready",
        "checks": results,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/full")
async def full_health_check(response: Response):
    """
    Comprehensive health check of all dependencies
    Use for debugging and monitoring dashboards
    """
    start_time = time.time()

    # Run all checks in parallel
    checks = await asyncio.gather(
        check_postgres(),
        check_redis(),
        check_qdrant(),
        check_opensearch(),
        check_llm_providers(),
        return_exceptions=True
    )

    results = {
        "postgres": checks[0] if not isinstance(checks[0], Exception) else {"status": "error", "error": str(checks[0])},
        "redis": checks[1] if not isinstance(checks[1], Exception) else {"status": "error", "error": str(checks[1])},
        "qdrant": checks[2] if not isinstance(checks[2], Exception) else {"status": "error", "error": str(checks[2])},
        "opensearch": checks[3] if not isinstance(checks[3], Exception) else {"status": "error", "error": str(checks[3])},
        "llm": checks[4] if not isinstance(checks[4], Exception) else {"status": "error", "error": str(checks[4])}
    }

    total_time = (time.time() - start_time) * 1000

    # Count statuses
    healthy_count = sum(1 for r in results.values() if r.get("status") == "healthy")
    unhealthy_count = sum(1 for r in results.values() if r.get("status") in ["unhealthy", "error"])
    degraded_count = sum(1 for r in results.values() if r.get("status") == "degraded")

    # Determine overall status
    if unhealthy_count > 0:
        overall_status = "unhealthy"
        response.status_code = 503
    elif degraded_count > 0:
        overall_status = "degraded"
    else:
        overall_status = "healthy"

    return {
        "status": overall_status,
        "summary": {
            "healthy": healthy_count,
            "unhealthy": unhealthy_count,
            "degraded": degraded_count
        },
        "checks": results,
        "check_duration_ms": round(total_time, 2),
        "timestamp": datetime.utcnow().isoformat(),
        "version": os.getenv("APP_VERSION", "22.0.0"),
        "environment": os.getenv("ENVIRONMENT", "development")
    }


@router.get("/health/live")
async def liveness_probe():
    """
    Kubernetes liveness probe
    Simple check that the process is alive
    """
    return {"status": "alive"}
