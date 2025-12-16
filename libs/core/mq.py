import aio_pika
import json
import logging
import asyncio
from typing import Optional, Callable, Awaitable, List
from .config import settings

logger = logging.getLogger("predator.mq")

class MessageBroker:
    """
    Async RabbitMQ Client for Event Bus pattern.
    Uses 'predator.events' Topic Exchange.
    """
    def __init__(self):
        self.connection: Optional[aio_pika.RobustConnection] = None
        self.channel: Optional[aio_pika.RobustChannel] = None
        self.exchange: Optional[aio_pika.RobustExchange] = None
        self._closing = False

    async def connect(self) -> None:
        """Establish connection to RabbitMQ"""
        if self.connection and not self.connection.is_closed:
            return

        try:
            logger.info(f"Connecting to RabbitMQ at {settings.RABBITMQ_URL}...")
            self.connection = await aio_pika.connect_robust(
                settings.RABBITMQ_URL,
                timeout=5
            )
            self.channel = await self.connection.channel()

            # Topic exchange allows routing via keys like "ingest.created", "ingest.failed"
            self.exchange = await self.channel.declare_exchange(
                "predator.events",
                aio_pika.ExchangeType.TOPIC,
                durable=True
            )
            logger.info("✅ Connected to RabbitMQ Event Bus")
        except Exception as e:
            logger.warning(f"⚠️ RabbitMQ Connection Failed: {e}. Event Bus functionality will be limited.")
            self.connection = None

    async def publish(self, routing_key: str, message: dict, correlation_id: str = None) -> bool:
        """Publish a message to the exchange"""
        if not self.exchange:
            # Try lazy reconnect
            await self.connect()
            if not self.exchange:
                logger.error(f"Cannot publish to {routing_key}: No MQ connection")
                return False

        try:
            await self.exchange.publish(
                aio_pika.Message(
                    body=json.dumps(message).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    correlation_id=correlation_id,
                    content_type="application/json",
                    app_id="predator-backend"
                ),
                routing_key=routing_key
            )
            logger.debug(f"Published event: {routing_key}")
            return True
        except Exception as e:
            logger.error(f"Failed to publish event {routing_key}: {e}")
            return False

    async def subscribe(self, queue_name: str, routing_keys: List[str], callback: Callable[[dict], Awaitable[None]]):
        """
        Subscribe to messages.
        queue_name: Durable queue name (service specific)
        routing_keys: List of binding keys (e.g. ["ingest.#", "system.alert"])
        callback: Async function(data: dict)
        """
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
                    logger.error(f"Error processing message in {queue_name}: {e}")
                    # In production, we might want to Dead Letter this

        await queue.consume(_wrapper)
        logger.info(f"🎧 Subscribed queue '{queue_name}' to keys: {routing_keys}")

    async def close(self):
        """Close connection gracefully"""
        self._closing = True
        if self.connection:
            await self.connection.close()

# Singleton instance
broker = MessageBroker()
