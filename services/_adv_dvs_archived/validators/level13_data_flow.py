import os
"""
Рівень 13: Перевірка повного потоку даних.
Джерело → Парсер → ETL → PostgreSQL → Redpanda → ClickHouse → Neo4j →
Qdrant → OpenSearch → Backend → API → WebSocket → Frontend → DOM.
"""
from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class DataFlowValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level13_data_flow",
            description="Повний потік даних: Джерело → ... → Frontend → DOM",
        )

    async def _run_validation(self):
        """Перевірка кожної ланки data flow ланцюга."""

        # Ланцюг потоку даних
        flow_chain = [
            ("1_source_parser", "Парсер (ingestion-worker)", None, "tcp", TARGET_HOST, 8000),
            ("2_etl_postgres", "PostgreSQL (SSOT)", None, "tcp", TARGET_HOST, 5432),
            ("3_kafka_redpanda", "Redpanda/Kafka (Stream)", None, "tcp", TARGET_HOST, 19092),
            ("4_clickhouse", "ClickHouse (OLAP)", config.CLICKHOUSE_URL, "http", None, None),
            ("5_neo4j", "Neo4j (Graph)", None, "tcp", TARGET_HOST, 7687),
            ("6_qdrant", "Qdrant (Vector)", f"{config.QDRANT_URL}/healthz", "http", None, None),
            ("7_opensearch", "OpenSearch (Search)", f"{config.OPENSEARCH_URL}/_cluster/health", "http", None, None),
            ("8_backend_api", "Backend API", f"{config.CORE_API_URL}/api/v1/health", "http", None, None),
            ("9_frontend", "Frontend UI", config.FRONTEND_URL, "http", None, None),
        ]

        chain_ok = 0
        chain_total = len(flow_chain)

        for step_id, label, url, check_type, host, port in flow_chain:
            if check_type == "http" and url:
                r = await self.http_check(
                    f"flow_{step_id}",
                    url,
                    severity="warning",
                )
                if r.passed:
                    chain_ok += 1
            elif check_type == "tcp" and host and port:
                r = await self.tcp_check(
                    f"flow_{step_id}",
                    host, port,
                    severity="warning",
                )
                if r.passed:
                    chain_ok += 1

        # Загальна оцінка потоку
        flow_complete = chain_ok == chain_total
        self.add_check(CheckResult(
            name="data_flow_completeness",
            passed=flow_complete,
            message=f"Потік даних: {chain_ok}/{chain_total} ланок доступні",
            severity="critical" if chain_ok < chain_total // 2 else "warning",
            details={"available": chain_ok, "total": chain_total},
        ))
