"""PREDATOR Intelligence Sentinel — v61.0-ELITE.

Глобальний моніторинг цілісності інфраструктури та сервісів AI.
Sentinel перевіряє кожен компонент і повертає production-ready
health report для Kubernetes probes та HUD-панелей.

Компоненти:
- PostgreSQL (critical)
- Redis (critical)
- Kafka (critical)
- Neo4j (important)
- LiteLLM Gateway (optional)
- OpenSearch (optional)
- Qdrant (optional)
- MinIO (optional)
"""
import asyncio
import time
from datetime import UTC, datetime
from typing import Any

import httpx

from app.config import get_settings
from app.database import SessionLocal
from predator_common.logging import get_logger

logger = get_logger("sentinel_service")
settings = get_settings()


class ComponentStatus:
    """Стан окремого компонента."""

    OK = "ok"
    DEGRADED = "degraded"
    DOWN = "down"
    UNKNOWN = "unknown"


class SentinelService:
    """Сервіс глибокого моніторингу працездатності системи.

    Класифікація компонентів:
    - CRITICAL: postgres, redis, kafka — без них система не працює
    - IMPORTANT: neo4j — деградація аналітики
    - OPTIONAL: litellm, opensearch, qdrant, minio — деградація AI/пошуку
    """

    @staticmethod
    async def _check_postgres() -> dict[str, Any]:
        """Перевірка PostgreSQL."""
        start = time.monotonic()
        try:
            if SessionLocal is None:
                return {"status": ComponentStatus.DOWN, "latency_ms": 0, "error": "SessionLocal не ініціалізовано"}

            from sqlalchemy import text
            async with SessionLocal() as session:
                result = await session.execute(text("SELECT 1"))
                result.scalar()

            return {
                "status": ComponentStatus.OK,
                "latency_ms": round((time.monotonic() - start) * 1000, 1),
            }
        except Exception as e:
            return {
                "status": ComponentStatus.DOWN,
                "latency_ms": round((time.monotonic() - start) * 1000, 1),
                "error": str(e)[:200],
            }

    @staticmethod
    async def _check_redis() -> dict[str, Any]:
        """Перевірка Redis."""
        start = time.monotonic()
        try:
            from app.services.redis_service import get_redis_service
            redis = get_redis_service()
            if redis._connected and redis._client:
                await redis._client.ping()
                return {
                    "status": ComponentStatus.OK,
                    "latency_ms": round((time.monotonic() - start) * 1000, 1),
                }
            return {"status": ComponentStatus.DOWN, "latency_ms": 0, "error": "Не підключено"}
        except Exception as e:
            return {
                "status": ComponentStatus.DOWN,
                "latency_ms": round((time.monotonic() - start) * 1000, 1),
                "error": str(e)[:200],
            }

    @staticmethod
    async def _check_kafka() -> dict[str, Any]:
        """Перевірка Kafka Producer."""
        start = time.monotonic()
        try:
            from app.services.kafka_service import get_kafka_service
            kafka = get_kafka_service()
            if kafka._connected and kafka._producer:
                return {
                    "status": ComponentStatus.OK,
                    "latency_ms": round((time.monotonic() - start) * 1000, 1),
                }
            return {"status": ComponentStatus.DOWN, "latency_ms": 0, "error": "Не підключено"}
        except Exception as e:
            return {
                "status": ComponentStatus.DOWN,
                "latency_ms": round((time.monotonic() - start) * 1000, 1),
                "error": str(e)[:200],
            }

    @staticmethod
    async def _check_neo4j() -> dict[str, Any]:
        """Перевірка Neo4j."""
        start = time.monotonic()
        try:
            from app.core.graph import graph_db
            async with graph_db.get_session() as session:
                await session.run("RETURN 1")
            return {
                "status": ComponentStatus.OK,
                "latency_ms": round((time.monotonic() - start) * 1000, 1),
            }
        except Exception as e:
            return {
                "status": ComponentStatus.DEGRADED,
                "latency_ms": round((time.monotonic() - start) * 1000, 1),
                "error": str(e)[:200],
            }

    @staticmethod
    async def _check_http_service(
        name: str,
        url: str,
        path: str = "/health",
        timeout: float = 3.0,
    ) -> dict[str, Any]:
        """Перевірка HTTP-сервісу (LiteLLM, OpenSearch, Qdrant, MinIO)."""
        start = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(f"{url}{path}")
                latency = round((time.monotonic() - start) * 1000, 1)
                if response.status_code < 400:
                    return {"status": ComponentStatus.OK, "latency_ms": latency}
                return {
                    "status": ComponentStatus.DEGRADED,
                    "latency_ms": latency,
                    "error": f"HTTP {response.status_code}",
                }
        except Exception as e:
            return {
                "status": ComponentStatus.DOWN,
                "latency_ms": round((time.monotonic() - start) * 1000, 1),
                "error": str(e)[:200],
            }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @staticmethod
    async def check_readiness() -> dict[str, Any]:
        """Перевірка готовності всіх компонентів платформи.

        Kubernetes readinessProbe: повертає 200 тільки якщо CRITICAL ok.
        """
        # Паралельна перевірка всіх компонентів
        results = await asyncio.gather(
            SentinelService._check_postgres(),
            SentinelService._check_redis(),
            SentinelService._check_kafka(),
            SentinelService._check_neo4j(),
            SentinelService._check_http_service("litellm", settings.LITELLM_GATEWAY_URL),
            SentinelService._check_http_service("opensearch", settings.OPENSEARCH_HOSTS, path="/"),
            SentinelService._check_http_service("qdrant", settings.QDRANT_URL, path="/"),
            SentinelService._check_http_service("minio", settings.MINIO_ENDPOINT, path="/minio/health/live"),
            return_exceptions=True,
        )

        component_names = [
            "postgres", "redis", "kafka", "neo4j",
            "litellm", "opensearch", "qdrant", "minio",
        ]

        checks: dict[str, Any] = {}
        for name, result in zip(component_names, results):
            if isinstance(result, Exception):
                checks[name] = {"status": ComponentStatus.DOWN, "error": str(result)[:200]}
            else:
                checks[name] = result

        # Визначення загального статусу
        critical = ["postgres", "redis", "kafka"]
        critical_ok = all(
            checks.get(c, {}).get("status") == ComponentStatus.OK
            for c in critical
        )

        important_ok = checks.get("neo4j", {}).get("status") == ComponentStatus.OK

        if critical_ok and important_ok:
            overall = "ready"
        elif critical_ok:
            overall = "degraded"
        else:
            overall = "not_ready"
            logger.critical(
                "🛡️ SENTINEL: Інфраструктура NOT READY!",
                extra={"failed": [k for k, v in checks.items() if v.get("status") != ComponentStatus.OK]},
            )

        return {
            "status": overall,
            "components": checks,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    @staticmethod
    async def check_liveness() -> dict[str, Any]:
        """Kubernetes livenessProbe: перевірка що процес живий."""
        return {
            "status": "alive",
            "version": settings.APP_VERSION,
            "uptime_check": True,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    @staticmethod
    async def get_health_report() -> dict[str, Any]:
        """Повний звіт про стан системи для HUD-панелей AdminHub."""
        readiness = await SentinelService.check_readiness()

        # Підрахунок метрик
        components = readiness.get("components", {})
        total = len(components)
        healthy = sum(1 for v in components.values() if v.get("status") == ComponentStatus.OK)
        degraded = sum(1 for v in components.values() if v.get("status") == ComponentStatus.DEGRADED)
        down = sum(1 for v in components.values() if v.get("status") == ComponentStatus.DOWN)

        # Середня latency
        latencies = [
            v.get("latency_ms", 0)
            for v in components.values()
            if isinstance(v.get("latency_ms"), (int, float))
        ]
        avg_latency = round(sum(latencies) / max(len(latencies), 1), 1)

        # Feature flags
        feature_flags = {
            "kafka": settings.FF_KAFKA_ENABLED,
            "opensearch": settings.FF_OPENSEARCH_ENABLED,
            "qdrant": settings.FF_QDRANT_ENABLED,
            "rag": settings.FF_RAG_ENABLED,
            "anomaly_detection": settings.FF_ANOMALY_DETECTION,
            "sovereign_ai": settings.FF_SOVEREIGN_AI,
        }

        return {
            "sentinel_version": settings.APP_VERSION,
            "environment": settings.ENV,
            "timestamp": datetime.now(UTC).isoformat(),
            **readiness,
            "metrics": {
                "total_components": total,
                "healthy": healthy,
                "degraded": degraded,
                "down": down,
                "avg_latency_ms": avg_latency,
                "health_percentage": round(healthy / max(total, 1) * 100, 1),
            },
            "feature_flags": feature_flags,
            "circuit_breaker": {
                "failure_threshold": settings.CB_FAILURE_THRESHOLD,
                "reset_timeout_s": settings.CB_RESET_TIMEOUT_S,
            },
            "vram_guard": {
                "limit_mb": settings.VRAM_LIMIT_MB,
                "llm_pool_mb": settings.VRAM_LLM_POOL_MB,
                "ui_reserve_mb": settings.VRAM_UI_RESERVE_MB,
            },
        }
