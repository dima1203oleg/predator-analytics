import os
"""
Рівень 5: Перевірка баз даних (8 систем).
PostgreSQL, ClickHouse, Neo4j, Qdrant, OpenSearch, Redis, MinIO, Redpanda/Kafka.
"""
import httpx
from typing import Dict, Any

from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class DatabasesValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level5_databases",
            description="Бази даних: PostgreSQL, ClickHouse, Neo4j, Qdrant, OpenSearch, Redis, MinIO, Redpanda",
        )

    async def _run_validation(self):
        # 1. PostgreSQL (SSOT)
        await self._check_postgres()
        # 2. ClickHouse (OLAP)
        await self._check_clickhouse()
        # 3. Neo4j (Graph)
        await self._check_neo4j()
        # 4. Qdrant (Vector)
        await self._check_qdrant()
        # 5. OpenSearch (Search)
        await self._check_opensearch()
        # 6. Redis (Cache)
        await self._check_redis()
        # 7. MinIO (S3)
        await self._check_minio()
        # 8. Redpanda/Kafka (Stream)
        await self._check_kafka()

    async def _check_postgres(self):
        """PostgreSQL через TCP порт."""
        # DSN: postgresql+asyncpg://predator:predator@localhost:5432/predator
        host = TARGET_HOST
        port = 5432
        await self.tcp_check("postgres_tcp", host, port, severity="critical")

    async def _check_clickhouse(self):
        """ClickHouse через HTTP API."""
        url = config.CLICKHOUSE_URL
        # ClickHouse відповідає на /ping
        await self.http_check("clickhouse_ping", f"{url}/ping", severity="critical")
        # Також перевіримо основний HTTP інтерфейс
        r, data = await self.http_json_check(
            "clickhouse_query",
            f"{url}/?query=SELECT+1+FORMAT+JSON",
            severity="warning",
        )
        if data:
            self.add_check(CheckResult(
                name="clickhouse_query_ok",
                passed=True,
                message="ClickHouse відповідає на запити",
                severity="info",
            ))

    async def _check_neo4j(self):
        """Neo4j через TCP bolt порт та HTTP browser."""
        await self.tcp_check("neo4j_bolt", TARGET_HOST, 7687, severity="critical")
        await self.http_check("neo4j_browser", f"http://{TARGET_HOST}:7474", severity="warning")

    async def _check_qdrant(self):
        """Qdrant через REST API."""
        url = config.QDRANT_URL
        await self.http_check("qdrant_healthz", f"{url}/healthz", severity="critical")

        # Перевірка колекцій
        r, data = await self.http_json_check("qdrant_collections", f"{url}/collections", severity="warning")
        if data:
            collections = data.get("result", {}).get("collections", [])
            self.add_check(CheckResult(
                name="qdrant_collections_count",
                passed=True,
                message=f"Qdrant: {len(collections)} колекцій",
                severity="info",
                details={"collections": [c.get("name") for c in collections]},
            ))

    async def _check_opensearch(self):
        """OpenSearch через REST API."""
        url = config.OPENSEARCH_URL
        # Перевірка кластера
        r, data = await self.http_json_check(
            "opensearch_cluster",
            f"{url}/_cluster/health",
            severity="critical",
        )
        if data:
            status = data.get("status", "unknown")
            cluster_name = data.get("cluster_name", "")
            self.add_check(CheckResult(
                name="opensearch_cluster_status",
                passed=status in ("green", "yellow"),
                message=f"OpenSearch кластер '{cluster_name}': {status}",
                severity="warning" if status == "yellow" else "info",
                details={"cluster_status": status},
            ))

        # Перевірка індексів
        r2, indices = await self.http_json_check(
            "opensearch_indices",
            f"{url}/_cat/indices?format=json",
            severity="warning",
        )
        if indices and isinstance(indices, list):
            self.add_check(CheckResult(
                name="opensearch_indices_count",
                passed=True,
                message=f"OpenSearch: {len(indices)} індексів",
                severity="info",
                details={"count": len(indices)},
            ))

    async def _check_redis(self):
        """Redis через TCP порт."""
        await self.tcp_check("redis_tcp", TARGET_HOST, 6379, severity="critical")

    async def _check_minio(self):
        """MinIO через health endpoint."""
        url = config.MINIO_URL
        health = config.MINIO_HEALTH_PATH
        await self.http_check("minio_health", f"{url}{health}", severity="critical")

        # Console
        await self.http_check("minio_console", f"http://{TARGET_HOST}:9001", severity="warning")

    async def _check_kafka(self):
        """Redpanda/Kafka через TCP порт."""
        # Локальний порт Redpanda
        await self.tcp_check("kafka_tcp_9092", TARGET_HOST, 9092, severity="warning")
        await self.tcp_check("kafka_tcp_19092", TARGET_HOST, 19092, severity="warning")
