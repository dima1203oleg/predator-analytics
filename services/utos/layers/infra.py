"""
Шар тестування інфраструктури (Infra Layer) UTOS v61.0-ELITE.
Перевіряє доступність портів, статусів сервісів та базове підключення до всіх 8 БД і шини Redpanda.
"""
import asyncio
from typing import Dict, Any

from utos.config import (
    CORE_API_URL, CORE_API_HEALTH_PATH,
    FRONTEND_URL,
    KAFKA_BOOTSTRAP_SERVERS,
    REDIS_URL,
    POSTGRES_DSN,
    NEO4J_URI,
    CLICKHOUSE_URL,
    OPENSEARCH_URL,
    QDRANT_URL,
    MINIO_URL, MINIO_HEALTH_PATH,
    OLLAMA_URL,
    LITELLM_URL,
    PROMETHEUS_URL, GRAFANA_URL, LOKI_URL,
)
from utos.layers import BaseLayer, CheckResult


class InfraLayer(BaseLayer):
    """Шар валідації інфраструктури."""

    def __init__(self):
        super().__init__(
            name="infra",
            description="Валідація доступності мережевих портів, сервісів та 8 баз даних",
            weight=0.15,
        )

    async def _run_validation(self) -> None:
        # 1. Перевірка базових TCP портів
        # Розбираємо хости та порти з URL
        await self._validate_tcp_endpoints()

        # 2. HTTP Health Checks для ключових сервісів
        await self._validate_http_services()

    async def _validate_tcp_endpoints(self) -> None:
        """Перевірка портів критичної інфраструктури."""
        import urllib.parse
        
        def get_host_port(url_str, default_port):
            parsed = urllib.parse.urlparse(url_str)
            host = parsed.hostname or "localhost"
            port = parsed.port or default_port
            return host, port

        ch_host, ch_port = get_host_port(CLICKHOUSE_URL, 8123)
        await self.tcp_check("tcp_clickhouse", ch_host, ch_port, severity="critical")
        
        pg_host, pg_port = get_host_port(POSTGRES_DSN, 5432)
        await self.tcp_check("tcp_postgres", pg_host, pg_port, severity="critical")
        
        redis_host, redis_port = get_host_port(REDIS_URL, 6379)
        await self.tcp_check("tcp_redis", redis_host, redis_port, severity="critical")
        
        # Redpanda / Kafka
        kafka_host = KAFKA_BOOTSTRAP_SERVERS.split(":")[0]
        kafka_port = int(KAFKA_BOOTSTRAP_SERVERS.split(":")[1]) if ":" in KAFKA_BOOTSTRAP_SERVERS else 19092
        await self.tcp_check("tcp_redpanda", kafka_host, kafka_port, severity="critical")

        neo4j_host, neo4j_port = get_host_port(NEO4J_URI, 7687)
        await self.tcp_check("tcp_neo4j", neo4j_host, neo4j_port, severity="warning")

        qdrant_host, qdrant_port = get_host_port(QDRANT_URL, 6333)
        await self.tcp_check("tcp_qdrant", qdrant_host, qdrant_port, severity="warning")

        os_host, os_port = get_host_port(OPENSEARCH_URL, 9200)
        await self.tcp_check("tcp_opensearch", os_host, os_port, severity="warning")

    async def _validate_http_services(self) -> None:
        """Перевірка HTTP-сервісів (Health API, MinIO, AI Engine, Observability)."""
        # Core API Health
        await self.http_check(
            "http_core_api",
            f"{CORE_API_URL.rstrip('/')}{CORE_API_HEALTH_PATH}",
            severity="critical"
        )

        # Frontend UI
        await self.http_check(
            "http_frontend_ui",
            FRONTEND_URL,
            severity="warning"
        )

        # MinIO Health
        await self.http_check(
            "http_minio_s3",
            f"{MINIO_URL.rstrip('/')}{MINIO_HEALTH_PATH}",
            severity="critical"
        )

        # AI/LLM Ollama
        await self.http_check(
            "http_ollama",
            OLLAMA_URL,
            severity="warning"
        )

        # AI/LLM LiteLLM
        await self.http_check(
            "http_litellm",
            LITELLM_URL,
            severity="warning"
        )

        # Observability (Prometheus)
        await self.http_check(
            "http_prometheus",
            f"{PROMETHEUS_URL.rstrip('/')}/-/healthy",
            severity="warning"
        )
