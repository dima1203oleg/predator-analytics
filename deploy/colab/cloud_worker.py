import asyncio
import os
import logging
from predator_common.kafka import PredatorConsumer
from app.services.osint_vision_service import osint_vision

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ColabWorker")

async def process_task(task_type: str, data: dict):
    """Обробка завдань у хмарі."""
    logger.info(f"🚀 Обробка {task_type}...")
    if task_type == "vision_analysis":
        result = await osint_vision.analyze_document(data['image_url'])
        return result
    return {"status": "skipped"}

async def main():
    """Запуск воркера в хмарі."""
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    consumer = PredatorConsumer(
        topic="colab_tasks",
        group_id="colab_group",
        bootstrap_servers=bootstrap_servers
    )
    
    logger.info(f"🔗 Підключено до Kafka: {bootstrap_servers}")
    async for message in consumer:
        await process_task(message['type'], message['data'])

if __name__ == "__main__":
    asyncio.run(main())
