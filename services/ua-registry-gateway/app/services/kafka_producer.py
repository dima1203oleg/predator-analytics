"""Kafka Producer для UA Registry Gateway.

Асинхронна відправка подій у Kafka KRaft.
"""
import logging
from typing import Any

import orjson
from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaConnectionError

from app.config import get_settings

logger = logging.getLogger("ua_registry_gateway.kafka")
settings = get_settings()

_producer: AIOKafkaProducer | None = None


async def init_kafka_producer() -> None:
    """Ініціалізація Kafka producer при старті сервісу."""
    global _producer
    try:
        _producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BROKERS,
            value_serializer=lambda v: orjson.dumps(v),
            compression_type="gzip",
            max_batch_size=1_048_576,  # 1 MB
            linger_ms=10,
        )
        await _producer.start()
        logger.info("Kafka producer ініціалізовано", extra={"brokers": settings.KAFKA_BROKERS})
    except KafkaConnectionError as exc:
        logger.warning(f"Kafka недоступна: {exc}. Продовжуємо без Kafka.")
        _producer = None


async def close_kafka_producer() -> None:
    """Закриття Kafka producer при зупинці сервісу."""
    global _producer
    if _producer:
        await _producer.stop()
        _producer = None
        logger.info("Kafka producer зупинено")


def get_producer() -> AIOKafkaProducer | None:
    """Отримати поточний producer (або None якщо Kafka недоступна)."""
    return _producer


async def publish_event(topic: str, payload: dict[str, Any]) -> bool:
    """Опублікувати подію у Kafka топік.

    Args:
        topic: назва топіку
        payload: дані події (буде серіалізовано у JSON через orjson)

    Returns:
        True якщо успішно відправлено, False якщо Kafka недоступна.
    """
    producer = get_producer()
    if not producer:
        logger.warning(f"Kafka недоступна — подія для '{topic}' пропущена")
        return False
    try:
        await producer.send_and_wait(topic, value=payload)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Помилка відправки в Kafka [{topic}]: {exc}")
        return False
