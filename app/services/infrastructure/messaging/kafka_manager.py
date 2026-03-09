"""
Kafka Infrastructure Service (Phase 2D — SM Edition).

SM-optimized: single broker, 2GB RAM, JVM heap 1GB,
retention 24h + tiered storage to MinIO.
Topics: §17.1 (7 canonical topics).
"""
from datetime import datetime, timezone
from typing import Any


# §17.1 canonical Kafka topics
KAFKA_TOPICS: list[dict[str, Any]] = [
    {"name": "predator.ingestion.companies", "partitions": 6, "retention_h": 24, "schema": "CompanySchema"},
    {"name": "predator.ingestion.declarations", "partitions": 12, "retention_h": 24, "schema": "DeclarationSchema"},
    {"name": "predator.ingestion.sanctions", "partitions": 3, "retention_h": 24, "schema": "SanctionSchema"},
    {"name": "predator.events.risk-changed", "partitions": 6, "retention_h": 24, "schema": "RiskEventSchema"},
    {"name": "predator.events.alert-created", "partitions": 3, "retention_h": 24, "schema": "AlertEventSchema"},
    {"name": "predator.audit", "partitions": 3, "retention_h": 72, "schema": "AuditEventSchema"},
    {"name": "predator.dlq", "partitions": 1, "retention_h": 720, "schema": None},
]


class KafkaInfraManager:
    """Управління Kafka broker та topics (SM Edition)."""

    def __init__(self) -> None:
        self.broker_config: dict[str, Any] = {
            "broker_id": 0,
            "ram_limit": "2Gi",
            "jvm_heap": "-Xmx1g -Xms1g",
            "log_retention_hours": 24,
            "tiered_storage": "minio",
            "num_partitions_default": 3,
            "replication_factor": 1,  # SM: single broker
            "min_insync_replicas": 1,
        }

    def get_broker_status(self) -> dict[str, Any]:
        """Статус Kafka broker."""
        return {
            "status": "running",
            "broker_id": self.broker_config["broker_id"],
            "ram_limit": self.broker_config["ram_limit"],
            "jvm_heap": self.broker_config["jvm_heap"],
            "tiered_storage": self.broker_config["tiered_storage"],
            "topics_count": len(KAFKA_TOPICS),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def list_topics(self) -> list[dict[str, Any]]:
        """Перелік всіх канонічних Kafka topics."""
        return KAFKA_TOPICS

    def get_topic_details(self, topic_name: str) -> dict[str, Any] | None:
        """Деталі конкретного topic."""
        for topic in KAFKA_TOPICS:
            if topic["name"] == topic_name:
                return {
                    **topic,
                    "status": "active",
                    "messages_in_24h": 0,
                    "consumer_groups": [],
                }
        return None

    def get_consumer_lag(self) -> dict[str, Any]:
        """Consumer lag метрики."""
        return {
            "total_lag": 0,
            "consumer_groups": [],
            "status": "healthy",
        }
