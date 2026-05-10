"""CDC Pipeline - Change Data Capture для синхронізації між 8 БД.

Реалізує захоплення змін з PostgreSQL та розсилання в Kafka для:
- ClickHouse (OLAP аналітика)
- OpenSearch (повнотекстовий пошук)
- Qdrant (векторна пам'ять)
- Neo4j (граф зв'язків)
"""

import asyncio
import logging
from typing import Any
from dataclasses import dataclass

from aiokafka import AIOKafkaProducer
from asyncpg import connect

logger = logging.getLogger(__name__)


@dataclass
class CDCEvent:
    """Подія зміни даних."""
    operation: str  # INSERT, UPDATE, DELETE
    table: str
    record_id: str
    data: dict[str, Any]
    old_data: dict[str, Any] | None = None
    timestamp: str = ""


class CDCPipeline:
    """Pipeline для захоплення змін з PostgreSQL та публікації в Kafka."""

    def __init__(
        self,
        postgres_url: str,
        kafka_bootstrap_servers: str,
        kafka_topic: str = "predator.cdc.declarations",
    ) -> None:
        self.postgres_url = postgres_url
        self.kafka_bootstrap_servers = kafka_bootstrap_servers
        self.kafka_topic = kafka_topic
        self.producer: AIOKafkaProducer | None = None
        self.running = False

    async def start(self) -> None:
        """Запускає CDC pipeline."""
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.kafka_bootstrap_servers,
            value_serializer=lambda v: v.encode("utf-8"),
        )
        await self.producer.start()
        self.running = True
        logger.info("CDC Pipeline запущено")

    async def stop(self) -> None:
        """Зупиняє CDC pipeline."""
        self.running = False
        if self.producer:
            await self.producer.stop()
        logger.info("CDC Pipeline зупинено")

    async def publish_event(self, event: CDCEvent) -> None:
        """Публікує подію в Kafka."""
        if not self.producer:
            raise RuntimeError("Producer не ініціалізовано")

        import json

        message = json.dumps({
            "operation": event.operation,
            "table": event.table,
            "record_id": event.record_id,
            "data": event.data,
            "old_data": event.old_data,
            "timestamp": event.timestamp,
        })

        await self.producer.send_and_wait(self.kafka_topic, message)
        logger.debug(f"Подія опублікована: {event.table} {event.operation} {event.record_id}")

    async def listen_postgres_changes(self) -> None:
        """Слухає зміни в PostgreSQL через logical replication."""
        # TODO: Реалізувати logical replication (pgoutput/wal2json)
        # Поки що placeholder для скелетону
        conn = await connect(self.postgres_url)
        
        # В реальній реалізації тут буде:
        # 1. Підключення до replication slot
        # 2. Отримання WAL events
        # 3. Парсинг змін
        # 4. Публікація в Kafka через publish_event
        
        await conn.close()
        logger.info("PostgreSQL CDC listener запущено (placeholder)")

    async def run(self) -> None:
        """Головний цикл CDC pipeline."""
        await self.start()
        try:
            while self.running:
                await self.listen_postgres_changes()
                await asyncio.sleep(1)
        finally:
            await self.stop()
