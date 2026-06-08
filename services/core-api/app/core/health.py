"""Health Check Service - реальні перевірки сервісів.

Перевіряє стан основних залежностей платформи:
- PostgreSQL
- Redis
- Neo4j
- Kafka/Redpanda
- MinIO
- OpenSearch
- Qdrant
- LiteLLM/Ollama
- MLflow
"""

import asyncio
from datetime import UTC, datetime
from typing import Any

import asyncpg
import httpx
from neo4j import AsyncGraphDatabase
import redis.asyncio as redis

from app.config import get_settings
from predator_common.logging import get_logger

logger = get_logger("core_api.health")


class HealthCheckService:
    """Сервіс для перевірки здоров'я системи."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def _testing_response(
        self,
        name: str,
        details: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Скорочена відповідь для тестового режиму."""
        return {
            "status": "ok",
            "duration_seconds": 0.0,
            "timestamp": datetime.now(UTC).isoformat(),
            "details": {
                "mode": "testing",
                "service": name,
                **(details or {}),
            },
        }

    def _resolve_first_host(self, raw_value: str) -> str:
        """Повертає перший хост із рядка конфігурації."""
        host = raw_value.split(",")[0].strip().strip("[]").strip("'").strip('"')
        if host.startswith("http://") or host.startswith("https://"):
            return host
        return f"http://{host}"

    def _service_enabled(self, raw_value: str | None) -> bool:
        """Перевіряє чи сервіс реально сконфігурований (не localhost і не порожній)."""
        if not raw_value:
            return False
        # Витягуємо хост з URL типу redis://host:port або bolt://host:port
        host = raw_value.split("://")[-1].split(":")[0].split(",")[0].strip()
        return host not in ("localhost", "127.0.0.1", "")

    async def _http_check(
        self,
        url: str,
        *,
        timeout_seconds: float = 3.0,
        auth: tuple[str, str] | None = None,
        verify: bool = True,
    ) -> tuple[httpx.Response, float]:
        """Виконує HTTP health check і повертає response та тривалість."""
        start_time = datetime.now(UTC)
        async with httpx.AsyncClient(verify=verify) as client:
            response = await client.get(
                url,
                timeout=timeout_seconds,
                auth=auth,
            )
        duration = (datetime.now(UTC) - start_time).total_seconds()
        return response, duration

    async def check_postgresql(self) -> dict[str, Any]:
        """Перевірити з'єднання з PostgreSQL."""
        if self.settings.TESTING:
            return self._testing_response("postgresql", {"database": self.settings.POSTGRES_DB})

        start_time = datetime.now(UTC)
        try:
            # Використовуємо DATABASE_URL напряму, asyncpg не підтримує postgresql+asyncpg://
            dsn = self.settings.DATABASE_URL or self.settings.async_database_url
            if dsn and "+asyncpg" in dsn:
                dsn = dsn.replace("+asyncpg", "")
            conn = await asyncpg.connect(
                dsn=dsn,
                server_settings={"application_name": "health_check"},
                command_timeout=5.0,
            )
            await conn.fetchval("SELECT 1")
            await conn.close()

            return {
                "status": "ok",
                "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "database": self.settings.POSTGRES_DB,
                    "server": self.settings.POSTGRES_SERVER,
                    "port": self.settings.POSTGRES_PORT,
                },
            }
        except Exception as exc:
            return {
                "status": "error",
                "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(exc),
                "details": {
                    "database": self.settings.POSTGRES_DB,
                    "server": self.settings.POSTGRES_SERVER,
                    "port": self.settings.POSTGRES_PORT,
                },
            }

    async def check_redis(self) -> dict[str, Any]:
        """Перевірити з'єднання з Redis."""
        if self.settings.TESTING:
            return self._testing_response("redis", {"url": self.settings.REDIS_URL})

        start_time = datetime.now(UTC)
        try:
            redis_client = redis.from_url(
                self.settings.REDIS_URL,
                socket_timeout=5.0,
                socket_connect_timeout=5.0,
            )
            result = await redis_client.ping()
            await redis_client.close()

            return {
                "status": "ok" if result else "error",
                "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "url": self.settings.REDIS_URL,
                    "ping_response": result,
                },
            }
        except Exception as exc:
            return {
                "status": "error",
                "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(exc),
                "details": {
                    "url": self.settings.REDIS_URL,
                },
            }

    async def check_neo4j(self) -> dict[str, Any]:
        """Перевірити з'єднання з Neo4j."""
        if self.settings.TESTING:
            return self._testing_response("neo4j", {"uri": self.settings.NEO4J_URI})

        start_time = datetime.now(UTC)
        driver = AsyncGraphDatabase.driver(
            self.settings.NEO4J_URI,
            auth=(self.settings.NEO4J_USER, self.settings.NEO4J_PASSWORD),
            max_connection_lifetime=30.0,
            connection_timeout=5.0,
        )

        try:
            session = driver.session()
            result = await session.run("RETURN 1 AS test")
            record = await result.single()
            await session.close()

            return {
                "status": "ok",
                "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "uri": self.settings.NEO4J_URI,
                    "user": self.settings.NEO4J_USER,
                    "test_result": record["test"] if record else None,
                },
            }
        except Exception as exc:
            return {
                "status": "error",
                "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(exc),
                "details": {
                    "uri": self.settings.NEO4J_URI,
                    "user": self.settings.NEO4J_USER,
                },
            }
        finally:
            await driver.close()

    async def check_kafka(self) -> dict[str, Any]:
        """Перевірити доступність Kafka/Redpanda."""
        if self.settings.TESTING:
            return self._testing_response("kafka", {"brokers": self.settings.KAFKA_BROKERS})

        start_time = datetime.now(UTC)
        try:
            from aiokafka import AIOKafkaProducer

            producer = AIOKafkaProducer(
                bootstrap_servers=self.settings.KAFKA_BROKERS,
                request_timeout_ms=5000,
            )
            try:
                await producer.start()
            finally:
                await producer.stop()

            return {
                "status": "ok",
                "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "brokers": self.settings.KAFKA_BROKERS,
                },
            }
        except Exception as exc:
            return {
                "status": "error",
                "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(exc),
                "details": {
                    "brokers": self.settings.KAFKA_BROKERS,
                },
            }

    async def check_minio(self) -> dict[str, Any]:
        """Перевірити доступність MinIO/S3."""
        if self.settings.TESTING:
            return self._testing_response("minio", {"endpoint": self.settings.MINIO_ENDPOINT})

        start_time = datetime.now(UTC)
        try:
            from minio import Minio

            client = Minio(
                self.settings.MINIO_ENDPOINT,
                access_key=self.settings.MINIO_ACCESS_KEY,
                secret_key=self.settings.MINIO_SECRET_KEY,
                secure=self.settings.MINIO_SECURE,
            )
            loop = asyncio.get_running_loop()
            buckets = await loop.run_in_executor(None, client.list_buckets)

            return {
                "status": "ok",
                "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "endpoint": self.settings.MINIO_ENDPOINT,
                    "secure": self.settings.MINIO_SECURE,
                    "bucket_count": len(buckets),
                },
            }
        except Exception as exc:
            return {
                "status": "error",
                "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(exc),
                "details": {
                    "endpoint": self.settings.MINIO_ENDPOINT,
                    "secure": self.settings.MINIO_SECURE,
                },
            }

    async def check_opensearch(self) -> dict[str, Any]:
        """Перевірити доступність OpenSearch."""
        if self.settings.TESTING:
            return self._testing_response("opensearch", {"endpoint": self.settings.OPENSEARCH_HOSTS})

        base_url = self._resolve_first_host(self.settings.OPENSEARCH_HOSTS)
        try:
            response, duration = await self._http_check(
                f"{base_url}/_cluster/health",
                timeout_seconds=3.0,
                auth=(self.settings.OPENSEARCH_USERNAME, self.settings.OPENSEARCH_PASSWORD),
                verify=self.settings.OPENSEARCH_TLS_VERIFY,
            )
            payload = response.json()
            cluster_status = payload.get("status", "unknown")

            return {
                "status": "ok" if cluster_status == "green" else "degraded",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "endpoint": base_url,
                    "cluster_status": cluster_status,
                    "number_of_nodes": payload.get("number_of_nodes"),
                    "active_shards": payload.get("active_shards"),
                },
            }
        except Exception as exc:
            return {
                "status": "error",
                "duration_seconds": 0.0,
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(exc),
                "details": {
                    "endpoint": base_url,
                },
            }

    async def check_qdrant(self) -> dict[str, Any]:
        """Перевірити доступність Qdrant."""
        if self.settings.TESTING:
            return self._testing_response("qdrant", {"endpoint": self.settings.QDRANT_URL})

        base_url = self.settings.QDRANT_URL.rstrip("/")
        try:
            response, duration = await self._http_check(
                f"{base_url}/collections",
                timeout_seconds=3.0,
            )
            payload = response.json()
            collections = payload.get("result", {}).get("collections", [])

            return {
                "status": "ok",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "endpoint": base_url,
                    "collections": len(collections),
                },
            }
        except Exception as exc:
            return {
                "status": "error",
                "duration_seconds": 0.0,
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(exc),
                "details": {
                    "endpoint": base_url,
                },
            }

    async def check_ollama(self) -> dict[str, Any]:
        """Перевірити доступність LiteLLM/Ollama."""
        if self.settings.TESTING:
            return self._testing_response(
                "litellm",
                {"endpoint": self.settings.LITELLM_API_BASE, "model": self.settings.LITELLM_MODEL},
            )

        try:
            response, duration = await self._http_check(
                f"{self.settings.LITELLM_API_BASE.rstrip('/')}/health/readiness",
                timeout_seconds=3.0,
            )
            return {
                "status": "ok" if response.status_code == 200 else "degraded",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "endpoint": self.settings.LITELLM_API_BASE,
                    "model": self.settings.LITELLM_MODEL,
                    "embedding_model": self.settings.OLLAMA_EMBEDDING_MODEL,
                },
            }
        except Exception as exc:
            return {
                "status": "error",
                "error": str(exc),
                "duration_seconds": 0.0,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "endpoint": self.settings.LITELLM_API_BASE,
                },
            }

    async def check_mlflow(self) -> dict[str, Any]:
        """Перевірити доступність MLflow Tracking Server."""
        mlflow_url = self.settings.MLFLOW_TRACKING_URL.rstrip("/")
        if self.settings.TESTING:
            return self._testing_response("mlflow", {"endpoint": mlflow_url})

        try:
            response, duration = await self._http_check(
                f"{mlflow_url}/health",
                timeout_seconds=3.0,
            )
            return {
                "status": "ok" if response.status_code == 200 else "degraded",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "endpoint": mlflow_url,
                },
            }
        except Exception as exc:
            return {
                "status": "offline",
                "error": str(exc),
                "duration_seconds": 0.0,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "endpoint": mlflow_url,
                },
            }

    async def check_clickhouse(self) -> dict[str, Any]:
        """Перевірити доступність ClickHouse (OLAP — HR-17)."""
        if self.settings.TESTING:
            return self._testing_response(
                "clickhouse",
                {"host": self.settings.CLICKHOUSE_HOST, "port": self.settings.CLICKHOUSE_PORT},
            )

        base_url = f"http://{self.settings.CLICKHOUSE_HOST}:{self.settings.CLICKHOUSE_PORT}"
        try:
            response, duration = await self._http_check(
                f"{base_url}/ping",
                timeout_seconds=3.0,
                auth=(self.settings.CLICKHOUSE_USER, self.settings.CLICKHOUSE_PASSWORD),
            )
            is_ok = response.status_code == 200 and "Ok" in response.text
            return {
                "status": "ok" if is_ok else "degraded",
                "duration_seconds": duration,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {
                    "host": self.settings.CLICKHOUSE_HOST,
                    "port": self.settings.CLICKHOUSE_PORT,
                    "database": self.settings.CLICKHOUSE_DATABASE,
                },
            }
        except Exception as exc:
            return {
                "status": "error",
                "duration_seconds": 0.0,
                "timestamp": datetime.now(UTC).isoformat(),
                "error": str(exc),
                "details": {
                    "host": self.settings.CLICKHOUSE_HOST,
                    "port": self.settings.CLICKHOUSE_PORT,
                },
            }

    async def _check_optional_service(
        self,
        name: str,
        check_func: Any,
        enabled: bool,
        timeout: float = 2.0,
    ) -> dict[str, Any]:
        """Перевіряє опціональний сервіс з таймаутом."""
        if not enabled:
            return {
                "status": "disabled",
                "duration_seconds": 0.0,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {"reason": "not configured"},
            }
        try:
            return await asyncio.wait_for(check_func(), timeout=timeout)
        except TimeoutError:
            return {
                "status": "timeout",
                "duration_seconds": timeout,
                "timestamp": datetime.now(UTC).isoformat(),
                "details": {"reason": f"timeout after {timeout}s"},
            }
        except Exception as exc:
            return {
                "status": "error",
                "error": str(exc),
                "duration_seconds": 0.0,
                "timestamp": datetime.now(UTC).isoformat(),
            }

    async def comprehensive_health_check(self) -> dict[str, Any]:
        """Комплексна перевірка здоров'я всіх сервісів.

        Оптимізовано для K8s probes: критичні сервіси перевіряються швидко,
        опціональні — з коротким таймаутом або skipped якщо не сконфігуровані.
        """
        if self.settings.TESTING:
            timestamp = datetime.now(UTC).isoformat()
            services = {
                "postgresql": self._testing_response("postgresql"),
                "clickhouse": self._testing_response("clickhouse"),
                "redis": self._testing_response("redis"),
                "neo4j": self._testing_response("neo4j"),
                "kafka": self._testing_response("kafka"),
                "minio": self._testing_response("minio"),
                "opensearch": self._testing_response("opensearch"),
                "qdrant": self._testing_response("qdrant"),
                "ollama": self._testing_response("litellm"),
                "mlflow": self._testing_response("mlflow"),
            }
            return {
                "status": "ok",
                "timestamp": timestamp,
                "version": self.settings.APP_VERSION,
                "environment": self.settings.ENV,
                "services": services,
                "summary": {
                    "total": len(services),
                    "healthy": len(services),
                    "degraded": 0,
                    "failed": 0,
                },
            }

        logger.debug("Початок комплексної перевірки стану системи")

        # Критичні сервіси — завжди перевіряємо
        critical_checks = [
            ("postgresql", self.check_postgresql),
            ("redis", self.check_redis),
        ]

        # Опціональні сервіси — перевіряємо тільки якщо реально сконфігуровані (не localhost)
        optional_checks = [
            ("clickhouse", self.check_clickhouse, self._service_enabled(self.settings.CLICKHOUSE_HOST)),
            ("neo4j", self.check_neo4j, self._service_enabled(self.settings.NEO4J_URI)),
            ("kafka", self.check_kafka, self._service_enabled(self.settings.KAFKA_BROKERS)),
            ("minio", self.check_minio, self._service_enabled(self.settings.MINIO_ENDPOINT)),
            ("opensearch", self.check_opensearch, self._service_enabled(self.settings.OPENSEARCH_HOSTS)),
            ("qdrant", self.check_qdrant, self._service_enabled(self.settings.QDRANT_URL)),
            ("ollama", self.check_ollama, self._service_enabled(self.settings.LITELLM_API_BASE)),
            ("mlflow", self.check_mlflow, self._service_enabled(self.settings.MLFLOW_TRACKING_URL)),
        ]

        # Спочатку критичні (швидко)
        critical_results = await asyncio.gather(
            *(check() for _, check in critical_checks),
            return_exceptions=True,
        )

        services: dict[str, dict[str, Any]] = {}
        overall_status = "ok"

        for (name, _check), result in zip(critical_checks, critical_results, strict=False):
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

        # Потім опціональні (з коротким таймаутом)
        optional_results = await asyncio.gather(
            *(
                self._check_optional_service(name, check, enabled, timeout=2.0)
                for name, check, enabled in optional_checks
            ),
            return_exceptions=True,
        )

        for (name, _check, _enabled), result in zip(optional_checks, optional_results, strict=False):
            if isinstance(result, Exception):
                services[name] = {
                    "status": "error",
                    "error": str(result),
                    "timestamp": datetime.now(UTC).isoformat(),
                }
            else:
                services[name] = result
                if result["status"] not in {"ok", "disabled"}:
                    overall_status = "degraded"

        summary = {
            "total": len(services),
            "healthy": sum(1 for service in services.values() if service.get("status") == "ok"),
            "degraded": sum(
                1
                for service in services.values()
                if service.get("status") in {"degraded", "offline", "timeout"}
            ),
            "failed": sum(1 for service in services.values() if service.get("status") == "error"),
            "disabled": sum(1 for service in services.values() if service.get("status") == "disabled"),
        }

        health_status = {
            "status": overall_status,
            "timestamp": datetime.now(UTC).isoformat(),
            "version": self.settings.APP_VERSION,
            "environment": self.settings.ENV,
            "services": services,
            "summary": summary,
        }

        logger.debug(
            "Комплексну перевірку завершено",
            extra={
                "overall_status": overall_status,
                "healthy_services": summary["healthy"],
                "failed_services": summary["failed"],
                "disabled_services": summary["disabled"],
            },
        )
        return health_status


health_service = HealthCheckService()
