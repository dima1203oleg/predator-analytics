#!/usr/bin/env python3
"""Test script to produce mock customs declarations into Kafka
for PREDATOR Analytics Ingestion Worker.
"""

import asyncio
from datetime import UTC, datetime
import json
import logging
import uuid

from aiokafka import AIOKafkaProducer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mock_customs_producer")

KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
TOPIC_RAW = "tenant.default.ingestion.raw"

async def main():
    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    )
    await producer.start()

    try:
        # Створюємо кілька тестових декларацій
        declarations = [
            {
                "declaration_number": "UA100010/2026/000123",
                "declaration_date": datetime.now(UTC).isoformat(),
                "edrpou": "12345678",
                "name": "ТОВ ТЕСТ-ІМПОРТ",
                "company_edrpou": "12345678",
                "uktzed_code": "8517120000",
                "product_description": "Смартфони, телекомунікаційне обладнання",
                "weight": 120.5,
                "customs_value": 45000.0,
                "country_origin": "CN",
                "customs_post": "UA100000",
                "_record_hash": uuid.uuid4().hex
            },
            {
                "declaration_number": "UA200020/2026/000999",
                "declaration_date": datetime.now(UTC).isoformat(),
                "edrpou": "87654321",
                "name": "ПП ЕКСПОРТ-ЛЮКС",
                "company_edrpou": "87654321",
                "uktzed_code": "4407109100",
                "product_description": "Пиломатеріали хвойних порід",
                "weight": 25000.0,
                "customs_value": 12000.0,
                "country_origin": "UA",
                "customs_post": "UA200000",
                "_record_hash": uuid.uuid4().hex
            }
        ]

        event_id = str(uuid.uuid4())
        payload = {
            "event_id": event_id,
            "tenant_id": "default",
            "customs_declaration": declarations
        }

        logger.info(f"Sending customs_declaration event: {event_id}")
        await producer.send_and_wait(
            topic=TOPIC_RAW,
            value=json.dumps(payload).encode("utf-8"),
            key=event_id.encode("utf-8")
        )
        logger.info("Successfully sent message to Kafka.")

    finally:
        await producer.stop()

if __name__ == "__main__":
    asyncio.run(main())
