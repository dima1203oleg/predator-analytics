"""Kafka Emitter — PREDATOR Analytics v61.0-ELITE Ironclad.

Event Stream: CDC, ingestion events, pipeline notifications (HR: EventBus).
"""

from __future__ import annotations

import json
import os
from typing import Any

from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.kafka")

# Топіки згідно System Memory Contract
TOPIC_INGESTION_EVENTS = "predator.ingestion.events"
TOPIC_DECLARATION_CDC = "predator.cdc.declarations"
TOPIC_COMPANY_UPDATES = "predator.cdc.companies"


class KafkaEmitter:
    """Емітер подій у Kafka (CDC + ingestion notifications)."""

    def __init__(self) -> None:
        self.bootstrap_servers = os.getenv(
            "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"
        )
        self._producer: Any = None
        self._connected = False

    async def _get_producer(self) -> Any:
        if self._producer is None:
            try:
                from aiokafka import AIOKafkaProducer

                self._producer = AIOKafkaProducer(
                    bootstrap_servers=self.bootstrap_servers,
                    value_serializer=lambda v: json.dumps(
                        v, ensure_ascii=False, default=str
                    ).encode("utf-8"),
                    compression_type="gzip",
                )
                await self._producer.start()
                self._connected = True
                logger.info(
                    f"Kafka producer connected: {self.bootstrap_servers}"
                )
            except ImportError:
                logger.warning("aiokafka not installed, events disabled")
                return None
            except Exception as e:
                logger.warning(f"Kafka connection failed: {e}")
                return None
        return self._producer

    async def emit_ingestion_completed(
        self, job_id: str, tenant_id: str, stats: dict[str, Any]
    ) -> None:
        """Емітить подію про завершення інгестії."""
        producer = await self._get_producer()
        if not producer:
            return
        event = {
            "event_type": "ingestion.completed",
            "job_id": job_id,
            "tenant_id": tenant_id,
            "timestamp": stats.get("completed_at"),
            "total_rows": stats.get("total_rows"),
            "valid_rows": stats.get("valid_rows"),
            "quarantined_rows": stats.get("quarantined_rows"),
        }
        try:
            await producer.send_and_wait(TOPIC_INGESTION_EVENTS, event)
            logger.debug(f"Emitted ingestion event for job {job_id}")
        except Exception as e:
            logger.error(f"Kafka emit failed: {e}")

    async def emit_declaration_cdc(
        self, declaration: dict[str, Any], operation: str = "INSERT"
    ) -> None:
        """Емітить CDC-подію для декларації."""
        producer = await self._get_producer()
        if not producer:
            return
        event = {
            "operation": operation,
            "declaration_number": declaration.get("declaration_number"),
            "company_edrpou": declaration.get("company_edrpou"),
            "ueid": declaration.get("ueid"),
            "customs_value": declaration.get("customs_value"),
            "uktzed_code": declaration.get("uktzed_code"),
            "timestamp": declaration.get("_ingested_at"),
        }
        try:
            await producer.send_and_wait(TOPIC_DECLARATION_CDC, event)
        except Exception as e:
            logger.error(f"Kafka CDC emit failed: {e}")

    async def emit_company_update(
        self, ueid: str, edrpou: str, tenant_id: str
    ) -> None:
        """Емітить подію оновлення компанії."""
        producer = await self._get_producer()
        if not producer:
            return
        event = {
            "ueid": ueid,
            "edrpou": edrpou,
            "tenant_id": tenant_id,
            "operation": "UPSERT",
        }
        try:
            await producer.send_and_wait(TOPIC_COMPANY_UPDATES, event)
        except Exception as e:
            logger.error(f"Kafka company update emit failed: {e}")

    async def close(self) -> None:
        if self._producer:
            await self._producer.stop()
            self._producer = None
