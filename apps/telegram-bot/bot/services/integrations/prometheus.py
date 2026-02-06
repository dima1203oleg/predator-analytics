from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

class PrometheusClient:
    def __init__(self, url: str = "http://prometheus:9090"):
        self.url = url
        # В реальності тут буде aiohttp session

    async def get_relevant_metrics(self, params: dict[str, Any]) -> dict[str, Any]:
        """Отримує метрики, релевантні до контексту запиту."""
        issue_type = params.get("issue_type", "general")

        # MOCK DATA поки що, оскільки ми не налаштували реальний доступ до прометея звідси
        # Але структура готова до використання
        metrics = {
            "timestamp": "2025-12-20T12:00:00Z",
            "cluster_health": "healthy",
        }

        if issue_type == "latency":
             metrics.update({
                 "http_request_duration_seconds_p95": 0.45,
                 "active_requests": 150
             })
        elif issue_type == "memory":
             metrics.update({
                 "container_memory_usage_bytes": 1024*1024*512, # 512MB
                 "oom_kills": 0
             })

        # В реальності: query_prometheus(self.url, query)
        return metrics

    async def query_metrics(self, params: dict) -> dict:
        return await self.get_relevant_metrics(params)

    async def generate_graph(self, metric_name: str, labels: dict, duration: str) -> str:
        # Повертає URL на рендер графіку
        return f"https://grafana.predator.internal/d/xyz?var-metric={metric_name}"
