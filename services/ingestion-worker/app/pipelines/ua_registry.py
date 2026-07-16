"""UA Registry Ingestion Pipeline — PREDATOR Analytics v61.0-ELITE Ironclad."""
import json
from datetime import UTC, datetime
from typing import Any

from app.sinks.postgres_sink import PostgresSink
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.ua_registry_pipeline")

class UARegistryPipeline:
    """Пайплайн для обробки даних з ua-registry-gateway."""

    def __init__(self, postgres_sink: PostgresSink) -> None:
        """Ініціалізація пайплайну."""
        self.postgres_sink = postgres_sink

    async def process_event(self, topic: str, msg_value: dict[str, Any]) -> None:
        """Обробка однієї події (Prozorro або EDR)."""
        logger.info("processing_registry_event", topic=topic, event_id=msg_value.get("event_id"))
        
        event_type = msg_value.get("event_type")
        payload = msg_value.get("payload", [])
        
        if not payload:
            logger.warning("empty_payload_in_registry_event", topic=topic, event_id=msg_value.get("event_id"))
            return

        # TODO: Запис у PostgreSQL (сирі дані або розібрані на сутності)
        # Наразі просто логуємо або зберігаємо як JSONB у таблицю OSINT
        # Ця імплементація може бути розширена для використання Neo4j, Qdrant тощо.
        
        try:
            async with self.postgres_sink.pool.acquire() as conn:
                # Зберігаємо сирі OSINT події в загальну таблицю або аудит лог
                await conn.execute(
                    """
                    INSERT INTO osint_raw_events (topic, event_type, payload, collected_at, created_at)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    topic,
                    event_type,
                    json.dumps(payload),
                    datetime.fromisoformat(msg_value.get("timestamp", datetime.now(UTC).isoformat())),
                    datetime.now(UTC)
                )
            logger.info("registry_event_saved", topic=topic, event_type=event_type)
        except Exception as e:
            logger.error("registry_event_save_failed", error=str(e), topic=topic)
