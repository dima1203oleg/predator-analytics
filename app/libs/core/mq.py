from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any


try:
    import aio_pika
except ImportError:
    aio_pika = None

from app.libs.core.config import settings
from app.libs.core.structured_logger import get_logger


if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable


logger = get_logger("predator.mq")


class MessageBroker:
    """Async RabbitMQ Client for Event Bus pattern.
    Uses 'predator.events' Topic Exchange.
    """

    def __init__(self):
        self.connection: Any = None
        self.channel: Any = None
        self.exchange: Any = None
        self._closing = False

    async def connect(self) -> None:
        """Establish connection to RabbitMQ."""
        if aio_pika is None:
            logger.warning("⚠️ aio_pika not installed. MQ disabled.")
            return

        if self.connection and not self.connection.is_closed:
            return

        try:
            logger.info(f"Connecting to RabbitMQ at {settings.RABBITMQ_URL}...")
            self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL, timeout=5)
            self.channel = await self.connection.channel()

            # Topic exchange allows routing via keys like "ingest.created", "ingest.failed"
            self.exchange = await self.channel.declare_exchange(
                "predator.events", aio_pika.ExchangeType.TOPIC, durable=True
            )
            logger.info("✅ Connected to RabbitMQ Event Bus")
        except Exception as e:
            logger.warning(f"⚠️ RabbitMQ Connection Failed: {e}. Event Bus functionality will be limited.")
            self.connection = None

    async def publish(self, routing_key: str, message: dict, correlation_id: str | None = None) -> bool:
        """Publish a message to the exchange."""
        if aio_pika is None:
            return False

        if not self.exchange:
            # Try lazy reconnect
            await self.connect()
            if not self.exchange:
                # logger.error(f"Cannot publish to {routing_key}: No MQ connection")
                return False

        try:
            await self.exchange.publish(
                aio_pika.Message(
                    body=json.dumps(message).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    correlation_id=correlation_id,
                    content_type="application/json",
                    app_id="predator-backend",
                ),
                routing_key=routing_key,
            )
            logger.debug(f"Published event: {routing_key}")
            return True
        except Exception as e:
            logger.exception(f"Failed to publish event {routing_key}: {e}")
            return False

    async def subscribe(self, queue_name: str, routing_keys: list[str], callback: Callable[[dict], Awaitable[None]]):
        """Subscribe to messages."""
        if aio_pika is None:
            return

        if not self.channel:
            await self.connect()

        if not self.channel:
            logger.error(f"Cannot subscribe to {queue_name}: No MQ connection")
            return

        # Declare queue
        queue = await self.channel.declare_queue(queue_name, durable=True)

        # Bind keys
        for key in routing_keys:
            await queue.bind(self.exchange, routing_key=key)

        # Message handler wrapper
        async def _wrapper(message: aio_pika.IncomingMessage):
            async with message.process():
                try:
                    body = json.loads(message.body.decode())
                    logger.debug(f"Received message on {message.routing_key}")
                    await callback(body)
                except Exception as e:
                    logger.exception(f"Error processing message in {queue_name}: {e}")

        await queue.consume(_wrapper)
        logger.info(f"🎧 Subscribed queue '{queue_name}' to keys: {routing_keys}")

    async def close(self):
        """Close connection gracefully."""
        self._closing = True
        if self.connection:
            await self.connection.close()


# Singleton instance
broker = MessageBroker()
