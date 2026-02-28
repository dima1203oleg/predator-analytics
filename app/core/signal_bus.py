"""Predator v55.0 — Signal Bus (Kafka/Redpanda abstraction).

All inter-engine communication goes through the Signal Bus.
Uses Redpanda (Kafka-compatible) already present in docker-compose.

Topics follow the pattern: predator.{domain}.{event}
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import Any, Optional
from uuid import uuid4

logger = logging.getLogger("predator.core.signal_bus")


# ═══════════════════════════════════════════════════════════════
# Topic Registry
# ═══════════════════════════════════════════════════════════════

TOPICS: dict[str, str] = {
    # Entity events
    "entity.created": "Нова сутність UEID створена",
    "entity.updated": "Сутність оновлена",
    "entity.resolved": "Entity resolution виконано",

    # Data events
    "data.ingested": "Дані завантажені та проіндексовані",
    "data.enriched": "Дані збагачені",
    "data.validated": "Дані валідовані",

    # Signal events (per analytical layer)
    "signal.behavioral": "Поведінковий сигнал (BVI/ASS/CP)",
    "signal.institutional": "Інституційний сигнал (AAI/PLS)",
    "signal.influence": "Сигнал впливу (IM/HCI)",
    "signal.structural": "Структурний сигнал (MCI/PFI)",
    "signal.predictive": "Прогностичний сигнал",

    # CERS events
    "cers.updated": "CERS перераховано для суб'єкта",
    "cers.level_changed": "Рівень CERS змінився",

    # Alert events
    "alert.critical": "Критичне сповіщення",
    "alert.warning": "Попередження",
    "alert.anomaly": "Виявлено аномалію",

    # Ingestion lifecycle
    "ingestion.started": "Інгестія розпочата",
    "ingestion.progress": "Прогрес інгестії",
    "ingestion.completed": "Інгестія завершена",
    "ingestion.failed": "Інгестія зазнала невдачі",

    # Decision artifacts
    "decision.recorded": "Рішення зафіксовано в Decision Ledger",
}


# ═══════════════════════════════════════════════════════════════
# Signal Envelope
# ═══════════════════════════════════════════════════════════════

def create_signal_envelope(
    topic: str,
    payload: dict[str, Any],
    ueid: Optional[str] = None,
    trace_id: Optional[str] = None,
    confidence: Optional[float] = None,
) -> dict[str, Any]:
    """Create a standardized signal envelope for the bus.

    Args:
        topic: One of the registered topics.
        payload: Event-specific data.
        ueid: Related entity UEID (if applicable).
        trace_id: Distributed trace ID.
        confidence: Confidence score for this signal.

    Returns:
        Envelope dict ready for serialization.
    """
    return {
        "signal_id": str(uuid4()),
        "topic": topic,
        "timestamp": datetime.now(UTC).isoformat(),
        "trace_id": trace_id or str(uuid4()),
        "ueid": ueid,
        "confidence": confidence,
        "payload": payload,
        "version": "55.0",
    }


# ═══════════════════════════════════════════════════════════════
# Kafka Producer Abstraction
# ═══════════════════════════════════════════════════════════════

class SignalBus:
    """Async Kafka producer wrapper for the Signal Bus.

    Uses aiokafka under the hood, connecting to Redpanda.
    Falls back to logging if Kafka is unavailable (graceful degradation).
    """

    def __init__(self, bootstrap_servers: str = "redpanda:9092") -> None:
        self._bootstrap_servers = bootstrap_servers
        self._producer = None
        self._connected = False

    async def connect(self) -> None:
        """Connect to Kafka/Redpanda."""
        try:
            from aiokafka import AIOKafkaProducer

            self._producer = AIOKafkaProducer(
                bootstrap_servers=self._bootstrap_servers,
                value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            )
            await self._producer.start()
            self._connected = True
            logger.info("Signal Bus connected to %s", self._bootstrap_servers)
        except ImportError:
            logger.warning("aiokafka not installed — Signal Bus running in log-only mode")
        except Exception as e:
            logger.warning("Signal Bus connection failed: %s — running in log-only mode", e)

    async def disconnect(self) -> None:
        """Disconnect from Kafka/Redpanda."""
        if self._producer:
            await self._producer.stop()
            self._connected = False
            logger.info("Signal Bus disconnected")

    async def emit(
        self,
        topic: str,
        payload: dict[str, Any],
        ueid: Optional[str] = None,
        trace_id: Optional[str] = None,
        confidence: Optional[float] = None,
    ) -> str:
        """Emit a signal to the bus.

        Returns:
            signal_id of the emitted signal.
        """
        envelope = create_signal_envelope(
            topic=topic,
            payload=payload,
            ueid=ueid,
            trace_id=trace_id,
            confidence=confidence,
        )

        if self._connected and self._producer:
            try:
                kafka_topic = f"predator.{topic.replace('.', '_')}"
                await self._producer.send_and_wait(kafka_topic, envelope)
                logger.debug("Signal emitted: %s → %s", topic, envelope["signal_id"])
            except Exception as e:
                logger.error("Failed to emit signal %s: %s", topic, e)
        else:
            logger.info("Signal (log-only): %s | ueid=%s | confidence=%s",
                        topic, ueid, confidence)

        return envelope["signal_id"]


# Global singleton
signal_bus = SignalBus()
