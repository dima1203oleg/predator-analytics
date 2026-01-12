import os
import json
import asyncio
import logging
from typing import Dict, Any
try:
    from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
except ImportError:
    AIOKafkaProducer = None
    AIOKafkaConsumer = None

logger = logging.getLogger("service.kafka")

class KafkaService:
    """
    Central Message Bus for Predator v25.
    Handles real-time data streams from customs, sensors, and other agents.
    """
    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        self.producer = None
        self._loop = asyncio.get_event_loop()

    async def start(self):
        if AIOKafkaProducer is None:
            logger.warning("aiokafka not installed. Kafka functionality disabled.")
            return

        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            await self.producer.start()
            logger.info(f"Kafka Producer started on {self.bootstrap_servers}")
        except Exception as e:
            logger.error(f"Failed to start Kafka Producer: {e}")

    async def stop(self):
        if self.producer:
            await self.producer.stop()

    async def send_message(self, topic: str, message: Dict[str, Any]):
        """Send a message to a Kafka topic"""
        if not self.producer:
            logger.warning("Kafka Producer not running. Dropping message.")
            return

        try:
            await self.producer.send_and_wait(topic, message)
        except Exception as e:
            logger.error(f"Error sending Kafka message: {e}")

    async def consume_messages(self, topic: str):
        """Generator that yields messages from a topic"""
        if AIOKafkaConsumer is None:
            logger.warning("aiokafka not installed. Cannot consume.")
            return

        consumer = AIOKafkaConsumer(
            topic,
            bootstrap_servers=self.bootstrap_servers,
            group_id="predator_core",
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )
        await consumer.start()
        try:
            async for msg in consumer:
                yield msg.value
        finally:
            await consumer.stop()

# Singleton
kafka_service = KafkaService()
