"""
MinIO Object Storage Infrastructure Service (Phase 2E — SM Edition).

SM-optimized: 2GB RAM, NVMe storage, tiered Kafka archival.
"""
from datetime import datetime, timezone
from typing import Any


class MinIOInfraManager:
    """Управління MinIO S3-compatible object storage (SM Edition)."""

    def __init__(self) -> None:
        self.config: dict[str, Any] = {
            "ram_limit": "2Gi",
            "storage_class": "local-path",
            "erasure_coding": False,  # SM: single drive
            "versioning": True,
            "lifecycle_rules": True,
        }
        self.buckets: list[dict[str, Any]] = [
            {"name": "predator-documents", "purpose": "uploaded documents (PDF, XLSX, etc.)"},
            {"name": "predator-backups", "purpose": "WAL-G + Neo4j + ClickHouse backups"},
            {"name": "predator-kafka-tiered", "purpose": "Kafka tiered storage (retention >24h)"},
            {"name": "predator-models", "purpose": "ML model artifacts"},
            {"name": "predator-exports", "purpose": "generated PDF/DOCX dossiers and reports"},
            {"name": "predator-decision-artifacts", "purpose": "WORM AI decision archives"},
        ]

    def get_storage_status(self) -> dict[str, Any]:
        """Стан MinIO сховища."""
        return {
            "status": "running",
            "ram_limit": self.config["ram_limit"],
            "buckets": len(self.buckets),
            "versioning_enabled": self.config["versioning"],
            "lifecycle_rules": self.config["lifecycle_rules"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def list_buckets(self) -> list[dict[str, Any]]:
        """Перелік MinIO buckets."""
        return self.buckets

    def get_bucket_stats(self, bucket_name: str) -> dict[str, Any]:
        """Статистика конкретного bucket."""
        for b in self.buckets:
            if b["name"] == bucket_name:
                return {
                    **b,
                    "objects_count": 0,
                    "total_size_bytes": 0,
                    "versioning": True,
                    "status": "active",
                }
        return {"error": f"Bucket '{bucket_name}' не знайдено", "status": "not_found"}
