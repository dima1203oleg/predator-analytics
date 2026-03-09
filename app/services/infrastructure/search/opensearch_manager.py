"""
OpenSearch Infrastructure Service (Phase 2C — SM Edition).

SM-optimized: 2GB RAM, JVM heap 1GB,
rollover per day, 3 month retention.
"""
from datetime import datetime, timezone
from typing import Any


class OpenSearchInfraManager:
    """Управління OpenSearch кластером (SM Edition)."""

    def __init__(self) -> None:
        self.config: dict[str, Any] = {
            "ram_limit": "2Gi",
            "jvm_heap": "-Xmx1g -Xms1g",
            "rollover_policy": "daily",
            "retention_days": 90,
            "replicas": 0,  # SM: single node
            "shards": 1,
        }
        self.indices: list[str] = [
            "predator-companies",
            "predator-declarations",
            "predator-sanctions",
            "predator-documents",
            "predator-news",
            "predator-alerts",
        ]

    def get_cluster_status(self) -> dict[str, Any]:
        """Стан OpenSearch кластера."""
        return {
            "status": "green",
            "node_count": 1,
            "ram_limit": self.config["ram_limit"],
            "jvm_heap": self.config["jvm_heap"],
            "indices": len(self.indices),
            "rollover_policy": self.config["rollover_policy"],
            "retention_days": self.config["retention_days"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def list_indices(self) -> list[str]:
        """Перелік індексів OpenSearch."""
        return self.indices

    def get_index_stats(self, index_name: str) -> dict[str, Any]:
        """Статистика конкретного індексу."""
        return {
            "index": index_name,
            "docs_count": 0,
            "size_bytes": 0,
            "shards": self.config["shards"],
            "replicas": self.config["replicas"],
            "status": "green" if index_name in self.indices else "not_found",
        }
