"""Predator v55.0 — Signal Bus Consumer.

Listens to signals on Kafka/Redpanda and triggers downstream actions.
This is the heart of the asynchronous analytical pipeline.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Callable, Coroutine

from app.core.signal_bus import SignalBus
from app.libs.core.database import get_db_ctx

logger = logging.getLogger("predator.core.signal_consumer")


class SignalConsumer:
    """Async Kafka consumer for the Signal Bus.

    Listens to topics and executes registered handlers.
    """

    def __init__(self, bootstrap_servers: str = "redpanda:9092", group_id: str = "predator-core") -> None:
        self._bootstrap_servers = bootstrap_servers
        self._group_id = group_id
        self._consumer = None
        self._running = False
        self._handlers: dict[str, list[Callable[[dict[str, Any]], Coroutine[Any, Any, None]]]] = {}

    def register_handler(
        self, topic: str, handler: Callable[[dict[str, Any]], Coroutine[Any, Any, None]]
    ) -> None:
        """Register a handler for a specific topic."""
        if topic not in self._handlers:
            self._handlers[topic] = []
        self._handlers[topic].append(handler)
        logger.info("Registered handler for topic: %s", topic)

    async def start(self) -> None:
        """Start the consumer loop."""
        try:
            from aiokafka import AIOKafkaConsumer

            # Map our high-level topics to Kafka topics
            kafka_topics = [f"predator.{t.replace('.', '_')}" for t in self._handlers.keys()]
            
            if not kafka_topics:
                logger.warning("No handlers registered. Consumer will not start.")
                return

            self._consumer = AIOKafkaConsumer(
                *kafka_topics,
                bootstrap_servers=self._bootstrap_servers,
                group_id=self._group_id,
                value_deserializer=lambda v: json.loads(v.decode("utf-8")),
                auto_offset_reset="earliest",
            )
            await self._consumer.start()
            self._running = True
            logger.info("Signal Consumer started on %s, listening to: %s", self._bootstrap_servers, kafka_topics)

            asyncio.create_task(self._consume_loop())
        except ImportError:
            logger.warning("aiokafka not installed — Signal Consumer disabled")
        except Exception as e:
            logger.error("Signal Consumer start failed: %s", e)

    async def _consume_loop(self) -> None:
        """Main consumption loop."""
        try:
            async for msg in self._consumer:
                if not self._running:
                    break

                # Extract topic back to our format
                kafka_topic = msg.topic
                topic = kafka_topic.replace("predator.", "").replace("_", ".")
                
                envelope = msg.value
                logger.debug("Signal received: %s (id=%s)", topic, envelope.get("signal_id"))

                handlers = self._handlers.get(topic, [])
                for handler in handlers:
                    try:
                        await handler(envelope)
                    except Exception as e:
                        logger.exception("Handler failed for topic %s: %s", topic, e)
        except Exception as e:
            logger.error("Consumer loop error: %s", e)
        finally:
            self._running = False

    async def stop(self) -> None:
        """Stop the consumer."""
        self._running = False
        if self._consumer:
            await self._consumer.stop()
            logger.info("Signal Consumer stopped")


# ═══════════════════════════════════════════════════════════════
# Handlers
# ═══════════════════════════════════════════════════════════════

async def handle_data_ingested(envelope: dict[str, Any]) -> None:
    """Trigger analytical engines when new data is ingested."""
    ueid = envelope.get("ueid")
    if not ueid:
        return

    logger.info("Triggering analytical pipeline for ueid=%s (reason: data.ingested)", ueid)
    
    from app.engines.behavioral import process_entity as behavioral_process
    from app.engines.institutional import process_entity as institutional_process
    from app.engines.influence import process_entity as influence_process
    from app.engines.structural_gaps import process_entity as structural_process
    from app.engines.predictive import process_entity as predictive_process
    from app.engines.cers import process_entity as cers_process

    async with get_db_ctx() as db:
        try:
            # Sequential trigger for now (v55 spec 5.8)
            await behavioral_process(ueid, db)
            await institutional_process(ueid, db)
            await influence_process(ueid, db)
            await structural_process(ueid, db)
            await predictive_process(ueid, db)
            await cers_process(ueid, db)
            
            await db.commit()
            logger.info("Completed analytical pipeline for ueid=%s", ueid)
        except Exception as e:
            logger.exception("Async analytical pipeline failed for ueid=%s: %s", ueid, e)
            await db.rollback()


# Global instance
consumer = SignalConsumer()
consumer.register_handler("data.ingested", handle_data_ingested)
