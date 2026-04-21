"""PREDATOR Intelligence Sentinel (v56.5-ELITE).
Глобальний моніторинг цілісності інфраструктури та сервісів AI.
"""
import logging
import asyncio
from typing import Any, Dict
from app.core.graph import graph_db
from app.services.redis_service import redis_client
from app.services.kafka_service import kafka_service
from app.services.audit_service import audit_logger
from app.config import get_settings
import httpx

logger = logging.getLogger(__name__)
settings = get_settings()

class SentinelService:
    """Сервіс глибокого моніторингу працездатності системи."""

    @staticmethod
    async def check_readiness() -> Dict[str, Any]:
        """Перевірка готовності всіх компонентів платформи."""
        checks = {
            "postgres": False,
            "redis": False,
            "kafka": False,
            "neo4j": False,
            "litellm": False,
            "status": "ready"
        }

        # 1. Redis Check
        try:
            if redis_client and await redis_client.ping():
                checks["redis"] = True
        except Exception as e:
            logger.error(f"Sentinel: Redis failure: {e}")

        # 2. Neo4j Check
        try:
            # Використовуємо просту сесію для перевірки
            async with graph_db.get_session() as session:
                await session.run("RETURN 1")
            checks["neo4j"] = True
        except Exception as e:
            logger.error(f"Sentinel: Neo4j failure: {e}")

        # 3. Kafka Check
        try:
            if kafka_service and await kafka_service.check_health():
                checks["kafka"] = True
        except Exception as e:
            logger.error(f"Sentinel: Kafka failure: {e}")

        # 4. LiteLLM Gateway Check
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                response = await client.get(f"{settings.LITELLM_GATEWAY_URL}/health")
                if response.status_code == 200:
                    checks["litellm"] = True
        except Exception as e:
            logger.error(f"Sentinel: LiteLLM failure: {e}")

        # Визначення загального статусу
        critical_failed = not (checks["redis"] and checks["neo4j"] and checks["kafka"])
        if critical_failed:
            if checks["status"] != "degraded":
                logger.critical("🛡️ SENTINEL: Infrastructure is DEGRADED!")
                # Запис у WORM-аудит (HR-16)
                asyncio.create_task(audit_logger.log(
                    action="SENTINEL_DEGRADATION",
                    resource_type="INFRASTRUCTURE",
                    resource_id="GLOBAL",
                    details={"missing": [k for k, v in checks.items() if v is False]}
                ))
            checks["status"] = "degraded"

        return checks

    @staticmethod
    async def get_health_report() -> Dict[str, Any]:
        """Повний звіт про стан системи для HUD-панелей."""
        readiness = await SentinelService.check_readiness()
        return {
            "sentinel_version": "56.5-ELITE",
            "timestamp": asyncio.get_event_loop().time(),
            **readiness
        }
