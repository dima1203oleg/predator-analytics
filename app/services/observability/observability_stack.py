"""Observability Stack (Phase 6 — SM Edition).

Prometheus, Grafana, Loki, Tempo, Alertmanager.
SM: 6GB total RAM budget for observability.
Implements §19 and HR-11.
"""
from datetime import UTC, datetime
from typing import Any

# Observability resource allocations (§19.1)
OBSERVABILITY_COMPONENTS: list[dict[str, Any]] = [
    {
        "name": "prometheus",
        "ram_gb": 2.0,
        "cpu_cores": 1,
        "retention_days": 30,
        "scrape_interval": "15s",
        "port": 9090,
    },
    {
        "name": "grafana",
        "ram_gb": 1.0,
        "cpu_cores": 0.5,
        "dashboards": ["cers_overview", "ingestion_pipeline", "gpu_utilization", "api_latency",
                       "kafka_consumer_lag", "redis_memory", "pg_connections"],
        "port": 3000,
    },
    {
        "name": "loki",
        "ram_gb": 1.0,
        "cpu_cores": 0.5,
        "retention_days": 30,
        "log_format": "json",
        "port": 3100,
    },
    {
        "name": "tempo",
        "ram_gb": 1.0,
        "cpu_cores": 0.5,
        "retention_days": 7,
        "sampling_rate": 0.1,
        "port": 3200,
    },
    {
        "name": "alertmanager",
        "ram_gb": 0.5,
        "cpu_cores": 0.25,
        "channels": ["telegram", "email", "webhook"],
        "port": 9093,
    },
]

# Canonical Grafana dashboards (§19.3)
GRAFANA_DASHBOARDS: list[dict[str, str]] = [
    {"id": "cers-overview", "title": "CERS Огляд", "description": "5-layer scores, grade distribution"},
    {"id": "ingestion-pipeline", "title": "ETL Конвеєр", "description": "Job lifecycle, throughput, errors"},
    {"id": "gpu-utilization", "title": "GPU Використання", "description": "VRAM usage, time-slice allocation"},
    {"id": "api-latency", "title": "API Латенція", "description": "P50/P95/P99, error rates per endpoint"},
    {"id": "kafka-lag", "title": "Kafka Лаг", "description": "Consumer lag per topic/partition"},
    {"id": "redis-memory", "title": "Redis Пам'ять", "description": "Namespace usage, eviction rate"},
    {"id": "pg-connections", "title": "PG Підключення", "description": "PgBouncer pool, active queries"},
]


class ObservabilityStack:
    """Observability stack manager (SM Edition, 6GB total)."""

    def __init__(self) -> None:
        self.total_ram_gb: float = 6.0

    def get_stack_status(self) -> dict[str, Any]:
        """Стан observability stack."""
        total_used = sum(c["ram_gb"] for c in OBSERVABILITY_COMPONENTS)
        return {
            "status": "running",
            "total_ram_gb": self.total_ram_gb,
            "used_ram_gb": total_used,
            "components": len(OBSERVABILITY_COMPONENTS),
            "component_list": [{"name": c["name"], "ram_gb": c["ram_gb"]} for c in OBSERVABILITY_COMPONENTS],
            "updated_at": datetime.now(UTC).isoformat(),
        }

    def get_dashboards(self) -> list[dict[str, str]]:
        """Перелік Grafana dashboards."""
        return GRAFANA_DASHBOARDS

    def get_alerts_config(self) -> dict[str, Any]:
        """Конфігурація Alertmanager."""
        for c in OBSERVABILITY_COMPONENTS:
            if c["name"] == "alertmanager":
                return {
                    "channels": c["channels"],
                    "ram_gb": c["ram_gb"],
                    "critical_rules": [
                        "cers_confidence < 0.3 → alert",
                        "ingestion_job failed > 3 → alert",
                        "gpu_vram > 95% → alert",
                        "api_p99 > 2s → alert",
                        "kafka_lag > 10000 → alert",
                    ],
                }
        return {}
