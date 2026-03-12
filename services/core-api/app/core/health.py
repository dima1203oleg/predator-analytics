"""Health Check Service - Реальні перевірки сервісів.

Перевіряє стан всіх critical сервісів:
- PostgreSQL база даних
- Redis кеш
- Neo4j графова БД
- Kafka/Redpanda
- MinIO/S3
"""
import asyncio
from datetime import UTC, datetime
from typing import Any

import asyncpg
from neo4j import AsyncGraphDatabase
import redis.asyncio as redis

from app.config import get_settings
from predator_common.logging import get_logger

logger = get_logger("core_api.health")


class HealthCheckService:
    """Сервіс для перевірки здоров'я системи."""

    def __init__(self) -> None:
        self.settings = get_settings()

    async def check_postgresql(self) -> dict[str, Any]:
        """Перевірити з'єднання з PostgreSQL."""
        start_time = datetime.now(UTC)

        try:
            conn = await asyncpg.connect(
                dsn=self.settings.async_database_url,
                server_settings={'application_name': 'health_check'},
                command_timeout=5.0
            )

            # Простий запит для перевірки
            await conn.fetchval("SELECT 1")
            await conn.close()

            duration = (datetime.now(UTC) - start_time).total_seconds()

            return {
                "status": "ok",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "database": self.settings.POSTGRES_DB,
                    "server": self.settings.POSTGRES_SERVER,
                    "port": self.settings.POSTGRES_PORT,
                }
            }

        except Exception as e:
            duration = (datetime.now(UTC) - start_time).total_seconds()

            return {
                "status": "error",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(e),
                "details": {
                    "database": self.settings.POSTGRES_DB,
                    "server": self.settings.POSTGRES_SERVER,
                    "port": self.settings.POSTGRES_PORT,
                }
            }

    async def check_redis(self) -> dict[str, Any]:
        """Перевірити з'єднання з Redis."""
        start_time = datetime.now(UTC)

        try:
            redis_client = redis.from_url(
                self.settings.REDIS_URL,
                socket_timeout=5.0,
                socket_connect_timeout=5.0
            )

            # Простий ping
            result = await redis_client.ping()
            await redis_client.close()

            duration = (datetime.now(UTC) - start_time).total_seconds()

            return {
                "status": "ok" if result else "error",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "url": self.settings.REDIS_URL,
                    "ping_response": result,
                }
            }

        except Exception as e:
            duration = (datetime.now(UTC) - start_time).total_seconds()

            return {
                "status": "error",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(e),
                "details": {
                    "url": self.settings.REDIS_URL,
                }
            }

    async def check_neo4j(self) -> dict[str, Any]:
        """Перевірити з'єднання з Neo4j."""
        start_time = datetime.now(UTC)

        try:
            driver = AsyncGraphDatabase.driver(
                self.settings.NEO4J_URI,
                auth=(self.settings.NEO4J_USER, self.settings.NEO4J_PASSWORD),
                max_connection_lifetime=30.0,
                connection_timeout=5.0
            )

            # Простий запит
            session = driver.session()
            result = await session.run("RETURN 1 as test")
            record = await result.single()
            await session.close()
            await driver.close()

            duration = (datetime.now(UTC) - start_time).total_seconds()

            return {
                "status": "ok",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "uri": self.settings.NEO4J_URI,
                    "user": self.settings.NEO4J_USER,
                    "test_result": record["test"] if record else None,
                }
            }

        except Exception as e:
            duration = (datetime.now(UTC) - start_time).total_seconds()

            return {
                "status": "error",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(e),
                "details": {
                    "uri": self.settings.NEO4J_URI,
                    "user": self.settings.NEO4J_USER,
                }
            }

    async def check_kafka(self) -> dict[str, Any]:
        """Перевірити доступність Kafka/Redpanda."""
        start_time = datetime.now(UTC)

        try:
            from aiokafka import AIOKafkaProducer

            producer = AIOKafkaProducer(
                bootstrap_servers=self.settings.KAFKA_BROKERS,
                request_timeout_ms=5000,
            )

            await producer.start()
            await producer.stop()

            duration = (datetime.now(UTC) - start_time).total_seconds()

            return {
                "status": "ok",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "brokers": self.settings.KAFKA_BROKERS,
                }
            }

        except Exception as e:
            duration = (datetime.now(UTC) - start_time).total_seconds()

            return {
                "status": "error",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(e),
                "details": {
                    "brokers": self.settings.KAFKA_BROKERS,
                }
            }

    async def check_minio(self) -> dict[str, Any]:
        """Перевірити доступність MinIO/S3."""
        start_time = datetime.now(UTC)

        try:
            from minio import Minio

            client = Minio(
                self.settings.MINIO_ENDPOINT,
                access_key=getattr(self.settings, 'MINIO_ACCESS_KEY', 'minioadmin'),
                secret_key=getattr(self.settings, 'MINIO_SECRET_KEY', 'minioadmin'),
                secure=self.settings.MINIO_SECURE,
            )

            # Перевіряємо доступність через список бакетів
            buckets = await asyncio.get_event_loop().run_in_executor(
                None, client.list_buckets
            )

            duration = (datetime.now(UTC) - start_time).total_seconds()

            return {
                "status": "ok",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "endpoint": self.settings.MINIO_ENDPOINT,
                    "secure": self.settings.MINIO_SECURE,
                    "bucket_count": len(buckets),
                }
            }

        except Exception as e:
            duration = (datetime.now(UTC) - start_time).total_seconds()

            return {
                "status": "error",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(e),
                "details": {
                    "endpoint": self.settings.MINIO_ENDPOINT,
                    "secure": self.settings.MINIO_SECURE,
                }
            }

    async def comprehensive_health_check(self) -> dict[str, Any]:
        """Комплексна перевірка здоров'я всіх сервісів."""
        logger.info("Starting comprehensive health check")

        # Запускаємо всі перевірки паралельно
        tasks = {
            "postgresql": self.check_postgresql(),
            "redis": self.check_redis(),
            "neo4j": self.check_neo4j(),
            "kafka": self.check_kafka(),
            "minio": self.check_minio(),
        }

        await asyncio.gather(
            *[tasks[name] for name in tasks],
            return_exceptions=True
        )

        # Форматуємо результати
        services = {}
        overall_status = "ok"

        for _i, (name, result) in enumerate(tasks.items()):
            if isinstance(result, Exception):
                services[name] = {
                    "status": "error",
                    "error": str(result),
                    "timestamp": datetime.now(UTC).isoformat(),
                }
                overall_status = "degraded"
            else:
                services[name] = result
                if result["status"] != "ok":
                    overall_status = "degraded"

        # Загальний статус
        health_status = {
            "status": overall_status,
            "timestamp": datetime.now(UTC).isoformat(),
            "version": self.settings.APP_VERSION,
            "environment": self.settings.ENV,
            "services": services,
            "summary": {
                "total": len(services),
                "healthy": sum(1 for s in services.values() if s.get("status") == "ok"),
                "degraded": sum(1 for s in services.values() if s.get("status") == "error"),
            }
        }

        logger.info(
            "Health check completed",
            extra={
                "overall_status": overall_status,
                "healthy_services": health_status["summary"]["healthy"],
                "total_services": health_status["summary"]["total"],
            }
        )

        return health_status


# Global instance
health_service = HealthCheckService()
