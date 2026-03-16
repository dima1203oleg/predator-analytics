import os
import asyncio
import logging
from typing import List

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer, AIOKafkaAdminClient
from aiokafka.errors import TopicAlreadyExistsError

logger = logging.getLogger(__name__)

# Configuration – read from environment or defaults
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
DLQ_SUFFIX = os.getenv("DLQ_SUFFIX", "-dlq")

async def ensure_dlq_topic(topic: str) -> str:
    """Create a DLQ topic for the given source topic if it does not exist.
    Returns the DLQ topic name.
    """
    dlq_topic = f"{topic}{DLQ_SUFFIX}"
    admin = AIOKafkaAdminClient(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)
    await admin.start()
    try:
        await admin.create_topics([dlq_topic])
        logger.info(f"Created DLQ topic: {dlq_topic}")
    except TopicAlreadyExistsError:
        logger.debug(f"DLQ topic already exists: {dlq_topic}")
    finally:
        await admin.close()
    return dlq_topic

async def move_to_dlq(source_topic: str, group_id: str) -> None:
    """Consume from source_topic, on processing error move message to DLQ.
    This is a simplified example – real implementation would have proper error handling.
    """
    dlq_topic = await ensure_dlq_topic(source_topic)
    consumer = AIOKafkaConsumer(
        source_topic,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id=group_id,
        enable_auto_commit=False,
    )
    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)
    await consumer.start()
    await producer.start()
    try:
        async for msg in consumer:
            try:
                # Placeholder for real processing logic
                process_message(msg)
                await consumer.commit()
            except Exception as e:
                logger.error(f"Processing failed for message {msg.offset}: {e}, moving to DLQ")
                await producer.send_and_wait(dlq_topic, msg.value, key=msg.key, headers=msg.headers)
                await consumer.commit()
    finally:
        await consumer.stop()
        await producer.stop()

def process_message(msg):
    """Placeholder processing – raise exception to simulate failure.
    Replace with actual business logic.
    """
    # For demo, we just pass – in real code, implement processing.
    pass

async def replay_dlq(dlq_topic: str, target_topic: str) -> None:
    """Replay all messages from a DLQ back to the original topic.
    Consumes all messages from dlq_topic and produces them to target_topic.
    """
    consumer = AIOKafkaConsumer(
        dlq_topic,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id=f"replay-{dlq_topic}",
        enable_auto_commit=False,
        auto_offset_reset="earliest",
    )
    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)
    await consumer.start()
    await producer.start()
    try:
        async for msg in consumer:
            await producer.send_and_wait(target_topic, msg.value, key=msg.key, headers=msg.headers)
            await consumer.commit()
        logger.info(f"Replayed all messages from {dlq_topic} to {target_topic}")
    finally:
        await consumer.stop()
        await producer.stop()

async def main() -> None:
    # Example usage – adjust topics and group ids as needed.
    source = os.getenv("KAFKA_SOURCE_TOPIC", "events")
    group = os.getenv("KAFKA_CONSUMER_GROUP", "event-processor")
    # Run consumer that moves failed messages to DLQ (in background)
    # asyncio.create_task(move_to_dlq(source, group))
    # For manual replay, uncomment the following lines:
    # dlq = f"{source}{DLQ_SUFFIX}"
    # await replay_dlq(dlq, source)
    pass

if __name__ == "__main__":
    asyncio.run(main())
