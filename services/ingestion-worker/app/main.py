"""
Ingestion Worker Main Logic — PREDATOR Analytics v55.1 Ironclad.

Listens to Kafka events and triggers data processing pipelines.
"""
import asyncio
import signal
from aiokafka import AIOKafkaConsumer
from app.config import get_settings
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker")
settings = get_settings()

async def consume():
    consumer = AIOKafkaConsumer(
        "ingestion-triggers",
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="ingestion-group",
        auto_offset_reset="earliest"
    )
    await consumer.start()
    logger.info("ingestion_worker.started", topic="ingestion-triggers")
    
    try:
        async for msg in consumer:
            logger.info("ingestion_worker.msg_received", value=msg.value.decode())
            # TODO: Start pipeline based on message
    finally:
        await consumer.stop()

async def main():
    loop = asyncio.get_running_loop()
    
    # Graceful shutdown
    stop_event = asyncio.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop_event.set)

    consumer_task = asyncio.create_task(consume())
    
    await stop_event.wait()
    logger.info("ingestion_worker.stopping")
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
    logger.info("ingestion_worker.stopped")

if __name__ == "__main__":
    asyncio.run(main())
