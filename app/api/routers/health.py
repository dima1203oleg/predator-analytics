from __future__ import annotations

"""Health Check API for Predator Analytics
Comprehensive dependency checks for Kubernetes probes.
"""
import asyncio
import contextlib
from datetime import UTC, datetime
import logging
import os
import time
from typing import Any

from fastapi import APIRouter, Response, WebSocket, WebSocketDisconnect
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/metrics")
async def metrics_endpoint():
    """Prometheus metrics endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@router.get("/agents/status")
async def get_agents_status():
    """Get status of all autonomous agents from the orchestrator."""
    from libs.core.autonomy.orchestrator import orchestrator

    return orchestrator.get_stats()


@router.websocket("/ws/omniscience")
async def omniscience_ws(websocket: WebSocket):
    """Real-time system pulse and metrics via WebSocket."""
    await websocket.accept()
    logger.info("✅ Omniscience WS Client connected to Real Backend")
    try:
        while True:
            # Get latest status using existing logic
            status = await get_sovereign_status()
            await websocket.send_json(status)
            await asyncio.sleep(2)  # 2s pulse
    except WebSocketDisconnect:
        logger.info("❌ Omniscience WS Client disconnected")
    except Exception as e:
        logger.exception(f"WS Error: {e}")
    finally:
        with contextlib.suppress(BaseException):
            await websocket.close()


async def get_system_metrics() -> dict[str, Any]:
    """Get real-time system metrics (CPU, Memory, etc.)."""
    try:
        import psutil

        return {
            "cpu_percent": psutil.cpu_percent(interval=None),
            "memory_percent": psutil.virtual_memory().percent,
            "timestamp": datetime.now(UTC).isoformat(),
            "active_containers": 0,  # Placeholder or integrate with docker
            "container_raw": "NVIDIA_GOD_SERVER",
        }
    except Exception as e:
        logger.exception(f"Failed to get system metrics: {e}")
        return {"cpu_percent": 0, "memory_percent": 0, "error": str(e)}


async def check_postgres() -> dict[str, Any]:
    """Check PostgreSQL connection."""
    try:
        from sqlalchemy import text

        from app.core.database import engine

        start = time.time()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency = (time.time() - start) * 1000

        return {"status": "healthy", "latency_ms": float(f"{latency:.2f}")}
    except Exception as e:
        logger.exception(f"PostgreSQL check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


async def check_redis() -> dict[str, Any]:
    """Check Redis connection."""
    try:
        import redis.asyncio as aioredis

        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        start = time.time()

        redis = await aioredis.from_url(redis_url, socket_timeout=2)
        await redis.ping()
        await redis.close()

        latency = (time.time() - start) * 1000
        return {"status": "healthy", "latency_ms": float(f"{latency:.2f}")}
    except Exception as e:
        logger.exception(f"Redis check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


async def check_qdrant() -> dict[str, Any]:
    """Check Qdrant vector database and get point counts."""
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
            "latency_ms": float(f"{latency:.2f}"),
            "collections": len(collections),
            "vectors_count": total_points,
        }
    except Exception as e:
        logger.exception(f"Qdrant check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


async def check_opensearch() -> dict[str, Any]:
    """Check OpenSearch connection and get document counts."""
    try:
        from opensearchpy import AsyncOpenSearch

        opensearch_url = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
        start = time.time()

        client = AsyncOpenSearch(
            hosts=[opensearch_url], use_ssl=False, verify_certs=False, timeout=5
        )
        info = await client.info()

        # Get total docs count
        stats = await client.indices.stats()
        total_docs = stats.get("_all", {}).get("primaries", {}).get("docs", {}).get("count", 0)

        await client.close()

        latency = (time.time() - start) * 1000
        return {
            "status": "healthy",
            "latency_ms": float(f"{latency:.2f}"),
            "version": info.get("version", {}).get("number", "unknown"),
            "docs_count": total_docs,
        }
    except Exception as e:
        logger.exception(f"OpenSearch check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


async def check_llm_providers() -> dict[str, Any]:
    """Quick check of LLM provider availability."""
    try:
        from app.services.llm_keys import get_key_manager

        manager = get_key_manager()
        available = manager.get_available_providers()
        status = manager.get_status()

        return {
            "status": "healthy" if available else "degraded",
            "available_providers": available,
            "total_providers": len(status),
        }
    except Exception as e:
        logger.exception(f"LLM check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


@router.get("/health")
async def health_check():
    """Basic health check for Kubernetes liveness probe
    Returns 200 if service is running.
    """
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}


@router.get("/health/ready")
async def readiness_check(response: Response):
    """Readiness check for Kubernetes readiness probe
    Checks all critical dependencies.
    """
    def _safe_result(check: dict[str, Any] | BaseException) -> dict[str, Any]:
        """Normalise a gather result into a dict, even if it's an exception."""
        if isinstance(check, BaseException):
            return {"status": "error", "error": str(check)}
        return check

    # Run checks in parallel
    checks = await asyncio.gather(check_postgres(), check_redis(), return_exceptions=True)

    results: dict[str, dict[str, Any]] = {
        "postgres": _safe_result(checks[0]),
        "redis": _safe_result(checks[1]),
    }

    # Determine overall status
    all_healthy = all(
        v.get("status") == "healthy"
        for v in results.values()
    )

    if not all_healthy:
        response.status_code = 503

    return {
        "status": "ready" if all_healthy else "not_ready",
        "checks": results,
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/health/full")
async def full_health_check(response: Response):
    """Comprehensive health check of all dependencies
    Use for debugging and monitoring dashboards.
    """
    start_time = time.time()

    def _safe_result(check: dict[str, Any] | BaseException) -> dict[str, Any]:
        """Normalise a gather result into a dict, even if it's an exception."""
        if isinstance(check, BaseException):
            return {"status": "error", "error": str(check)}
        return check

    # Run all checks in parallel
    checks = await asyncio.gather(
        check_postgres(),
        check_redis(),
        check_qdrant(),
        check_opensearch(),
        check_llm_providers(),
        return_exceptions=True,
    )

    results: dict[str, dict[str, Any]] = {
        "postgres": _safe_result(checks[0]),
        "redis": _safe_result(checks[1]),
        "qdrant": _safe_result(checks[2]),
        "opensearch": _safe_result(checks[3]),
        "llm": _safe_result(checks[4]),
    }

    total_time = (time.time() - start_time) * 1000

    # Count statuses
    healthy_count = sum(1 for v in results.values() if v.get("status") == "healthy")
    unhealthy_count = sum(1 for v in results.values() if v.get("status") in ["unhealthy", "error"])
    degraded_count = sum(1 for v in results.values() if v.get("status") == "degraded")

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
            "degraded": degraded_count,
        },
        "checks": results,
        "check_duration_ms": float(f"{total_time:.2f}"),
        "timestamp": datetime.now(UTC).isoformat(),
        "version": os.getenv("APP_VERSION", "22.0.0"),
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


@router.get("/health/live")
async def liveness_probe():
    """Kubernetes liveness probe
    Simple check that the process is alive.
    """
    return {"status": "alive"}


@router.get("/health/v45")
async def v45_production_check():
    """v45 Sovereign Production Health Check."""
    return {
        "status": "OPERATIONAL",
        "system": "PREDATOR",
        "version": "30.0.0",
        "mode": "SOVEREIGN",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/system/status")
async def get_sovereign_status():
    """Canonical V45 System Status. Used by Dashboard and healthchecks."""
    metrics = await get_system_metrics()

    # Run a quick check on main services
    db_status = await check_postgres()
    redis_status = await check_redis()

    overall_status = "HEALTHY"
    if db_status["status"] != "healthy" or redis_status["status"] != "healthy":
        overall_status = "DEGRADED"

    return {
        "pulse": {
            "score": 100 if overall_status == "HEALTHY" else 50,
            "status": overall_status,
            "reasons": [] if overall_status == "HEALTHY" else ["Database or Redis degraded"],
            "alerts": [],
        },
        "system": metrics,
        "training": {"active": False, "progress": 0},
        "audit_logs": [],
        "sagas": [],
        "v45Realtime": metrics,
    }
