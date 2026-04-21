"""Kafka Service — PREDATOR Analytics v55.2-SM-EXTENDED.

Інтеграція з Kafka/Redpanda для асинхронної обробки даних.
Реалізація згідно TZ §2.4.
"""
from datetime import UTC, datetime
import json
from pathlib import Path

from aiokafka import AIOKafkaProducer
from pydantic import BaseModel

from app.config import get_settings
from predator_common.logging import get_logger

logger = get_logger("kafka_service")
settings = get_settings()


# ======================== ТОПІКИ (TZ v5.0 §5.1 / HR-17) ========================

class KafkaTopics:
    """Реєстр канонічних Kafka топіків (HR-17: tenant.{id}.category.name).

    Шаблон: tenant.{tenant_id}.{category}.{name}
    При використанні потрібно підставити конкретний tenant_id.
    Default значення — для single-tenant / dev середовища.
    """

    INGESTION_RAW = settings.KAFKA_TOPIC_INGESTION_RAW
    INGESTION_CLEANED = settings.KAFKA_TOPIC_INGESTION_CLEANED
    ENTITY_RESOLUTION = settings.KAFKA_TOPIC_ENTITY_RESOLUTION
    ENRICHMENT = settings.KAFKA_TOPIC_ENRICHMENT
    RISK_ALERTS = settings.KAFKA_TOPIC_RISK_ALERTS
    DLQ = settings.KAFKA_TOPIC_DLQ
    QUARANTINE = settings.KAFKA_TOPIC_QUARANTINE

    @staticmethod
    def for_tenant(tenant_id: str, category: str, name: str) -> str:
        """Формує назву топіка для конкретного тенанта."""
        return f"tenant.{tenant_id}.{category}.{name}"


# ======================== МОДЕЛІ ПОВІДОМЛЕНЬ (§2.4.2) ========================

class RawFileUpload(BaseModel):
    """Повідомлення про завантажений файл."""

    job_id: str
    tenant_id: str
    user_id: str
    file_name: str
    file_size_bytes: int
    file_content_hash: str
    upload_timestamp: int
    s3_bucket_path: str


class EntityUpsert(BaseModel):
    """Повідомлення про оновлення сутності."""

    entity_ueid: str
    tenant_id: str
    entity_type: str
    operation: str  # create, update, delete
    payload: dict
    timestamp: int


class RiskScoreEvent(BaseModel):
    """Повідомлення про розрахований ризик."""

    entity_ueid: str
    tenant_id: str
    cers: float
    confidence: float
    components: dict
    calculated_at: int


class AlertTriggeredEvent(BaseModel):
    """Повідомлення про спрацювання алерту."""

    alert_id: str
    tenant_id: str
    entity_ueid: str | None
    alert_type: str
    severity: str
    payload: dict
    triggered_at: int


# ======================== KAFKA PRODUCER ========================

class KafkaService:
    """Сервіс для роботи з Kafka.

    Підтримує offline-first режим: якщо Kafka недоступна,
    повідомлення зберігаються локально для подальшої відправки.
    """

    def __init__(self) -> None:
        self._producer: AIOKafkaProducer | None = None
        self._connected = False
        self._offline_dir = Path(settings.KAFKA_OFFLINE_DIR)
        self._offline_dir.mkdir(parents=True, exist_ok=True)

    async def connect(self) -> bool:
        """Підключення до Kafka."""
        if self._connected and self._producer:
            return True

        try:
            self._producer = AIOKafkaProducer(
                bootstrap_servers=settings.KAFKA_BROKERS,
                value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
                acks="all",
                enable_idempotence=True,
                max_batch_size=16384,
                linger_ms=10,
            )
            await self._producer.start()
            self._connected = True
            logger.info("Kafka producer підключено", extra={"brokers": settings.KAFKA_BROKERS})
            return True

        except Exception as e:
            logger.warning(f"Kafka недоступна, використовую offline режим: {e}")
            self._connected = False
            return False

    async def disconnect(self):
        """Відключення від Kafka."""
        if self._producer:
            await self._producer.stop()
            self._producer = None
            self._connected = False
            logger.info("Kafka producer відключено")

    async def send(
        self,
        topic: str,
        value: dict | BaseModel,
        key: str | None = None,
    ) -> bool:
        """Відправка повідомлення в топік.

        Args:
            topic: Назва топіку
            value: Дані повідомлення (dict або Pydantic model)
            key: Ключ партиціонування (опціонально)

        Returns:
            True якщо відправлено успішно, False якщо збережено offline

        """
        # Конвертуємо Pydantic model в dict
        payload = value.model_dump() if isinstance(value, BaseModel) else value

        # Спроба відправки в Kafka
        if self._connected and self._producer:
            try:
                await self._producer.send_and_wait(topic, value=payload, key=key)
                logger.debug(f"Відправлено в {topic}", extra={"key": key})
                return True
            except Exception as e:
                logger.error(f"Помилка відправки в Kafka: {e}")
                self._connected = False

        # Offline fallback
        await self._save_offline(topic, payload, key)
        return False

    async def _save_offline(self, topic: str, payload: dict, key: str | None):
        """Зберігає повідомлення локально для подальшої відправки."""
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S_%f")
        filename = f"{topic.replace('.', '_')}_{timestamp}.json"
        filepath = self._offline_dir / filename

        message = {
            "topic": topic,
            "key": key,
            "payload": payload,
            "saved_at": datetime.now(UTC).isoformat(),
        }

        try:
            filepath.write_text(json.dumps(message, default=str, ensure_ascii=False))
            logger.info(f"Збережено offline: {filename}")
        except Exception as e:
            logger.error(f"Помилка збереження offline: {e}")

    async def flush_offline(self) -> int:
        """Відправляє всі offline повідомлення в Kafka.

        Returns:
            Кількість успішно відправлених повідомлень

        """
        if not self._connected:
            await self.connect()

        if not self._connected:
            return 0

        sent_count = 0
        for filepath in self._offline_dir.glob("*.json"):
            try:
                message = json.loads(filepath.read_text())
                await self._producer.send_and_wait(
                    message["topic"],
                    value=message["payload"],
                    key=message.get("key"),
                )
                filepath.unlink()
                sent_count += 1
                logger.debug(f"Відправлено offline: {filepath.name}")
            except Exception as e:
                logger.error(f"Помилка відправки offline {filepath.name}: {e}")

        if sent_count > 0:
            logger.info(f"Відправлено {sent_count} offline повідомлень")

        return sent_count

    # ======================== CONVENIENCE METHODS ========================

    async def publish_file_upload(
        self,
        job_id: str,
        tenant_id: str,
        user_id: str,
        file_name: str,
        file_size: int,
        content_hash: str,
        s3_path: str,
    ) -> bool:
        """Публікує подію завантаження файлу."""
        event = RawFileUpload(
            job_id=job_id,
            tenant_id=tenant_id,
            user_id=user_id,
            file_name=file_name,
            file_size_bytes=file_size,
            file_content_hash=content_hash,
            upload_timestamp=int(datetime.now(UTC).timestamp() * 1000),
            s3_bucket_path=s3_path,
        )
        return await self.send(KafkaTopics.INGESTION_RAW, event, key=job_id)

    async def publish_entity_upsert(
        self,
        entity_ueid: str,
        tenant_id: str,
        entity_type: str,
        operation: str,
        payload: dict,
    ) -> bool:
        """Публікує подію оновлення сутності."""
        event = EntityUpsert(
            entity_ueid=entity_ueid,
            tenant_id=tenant_id,
            entity_type=entity_type,
            operation=operation,
            payload=payload,
            timestamp=int(datetime.now(UTC).timestamp() * 1000),
        )
        return await self.send(KafkaTopics.ENTITY_RESOLUTION, event, key=entity_ueid)

    async def publish_risk_score(
        self,
        entity_ueid: str,
        tenant_id: str,
        cers: float,
        confidence: float,
        components: dict,
    ) -> bool:
        """Публікує подію розрахунку ризику."""
        event = RiskScoreEvent(
            entity_ueid=entity_ueid,
            tenant_id=tenant_id,
            cers=cers,
            confidence=confidence,
            components=components,
            calculated_at=int(datetime.now(UTC).timestamp() * 1000),
        )
        return await self.send(KafkaTopics.RISK_ALERTS, event, key=entity_ueid)

    async def publish_alert_triggered(
        self,
        alert_id: str,
        tenant_id: str,
        alert_type: str,
        severity: str,
        payload: dict,
        entity_ueid: str | None = None,
    ) -> bool:
        """Публікує подію спрацювання алерту."""
        event = AlertTriggeredEvent(
            alert_id=alert_id,
            tenant_id=tenant_id,
            entity_ueid=entity_ueid,
            alert_type=alert_type,
            severity=severity,
            payload=payload,
            triggered_at=int(datetime.now(UTC).timestamp() * 1000),
        )
        return await self.send(KafkaTopics.RISK_ALERTS, event, key=alert_id)


# ======================== SINGLETON ========================

_kafka_service: KafkaService | None = None


def get_kafka_service() -> KafkaService:
    """Отримати singleton інстанс Kafka сервісу."""
    global _kafka_service
    if _kafka_service is None:
        _kafka_service = KafkaService()
    return _kafka_service


async def init_kafka():
    """Ініціалізація Kafka при старті застосунку."""
    service = get_kafka_service()
    await service.connect()
    # Спробувати відправити offline повідомлення
    await service.flush_offline()


async def close_kafka():
    """Закриття Kafka при зупинці застосунку."""
    global _kafka_service
    if _kafka_service:
        await _kafka_service.disconnect()
        _kafka_service = None
