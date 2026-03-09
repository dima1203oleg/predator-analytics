"""
Kafka Infrastructure API (Phase 2D — SM Edition).

Endpoints for managing Kafka broker, topics, and consumer lag.
"""
from fastapi import APIRouter
from typing import Any

from app.services.infrastructure.messaging.kafka_manager import KafkaInfraManager

router = APIRouter(prefix="/infra/messaging/kafka", tags=["Infrastructure & Messaging"])

_mgr = KafkaInfraManager()


@router.get("/status")
async def get_kafka_status() -> dict[str, Any]:
    """Стан Kafka broker."""
    return _mgr.get_broker_status()


@router.get("/topics")
async def list_kafka_topics() -> list[dict[str, Any]]:
    """Перелік всіх Kafka topics."""
    return _mgr.list_topics()


@router.get("/topics/{topic_name}")
async def get_kafka_topic(topic_name: str) -> dict[str, Any]:
    """Деталі конкретного Kafka topic."""
    result = _mgr.get_topic_details(topic_name)
    if result is None:
        return {"error": f"Topic '{topic_name}' не знайдено"}
    return result


@router.get("/consumer-lag")
async def get_consumer_lag() -> dict[str, Any]:
    """Consumer lag метрики."""
    return _mgr.get_consumer_lag()
