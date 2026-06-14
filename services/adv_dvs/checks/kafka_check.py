"""ADV DVS: Kafka Infrastructure Check."""
import os
import asyncio
from predator_common.logging import get_logger

try:
    from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
except ImportError:
    AIOKafkaConsumer = None
    AIOKafkaProducer = None

logger = get_logger("adv_dvs.checks.kafka")

async def check_kafka_connection() -> dict:
    """Перевіряє з'єднання з Kafka/Redpanda."""
    brokers = os.getenv("KAFKA_BROKERS", "redpanda:9092")
    logger.info(f"Перевірка підключення до Kafka за адресою: {brokers}")
    
    if not AIOKafkaConsumer:
        return {
            "status": "fail",
            "component": "kafka",
            "message": "aiokafka is not installed"
        }

    try:
        producer = AIOKafkaProducer(
            bootstrap_servers=brokers,
            request_timeout_ms=5000,
            retry_backoff_ms=500,
            client_id="adv_dvs_checker"
        )
        await producer.start()
        await producer.stop()
        
        return {
            "status": "passed",
            "component": "kafka",
            "message": "З'єднання з брокерами встановлено успішно."
        }
    except Exception as e:
        logger.error(f"Помилка підключення до Kafka: {e}")
        return {
            "status": "fail",
            "component": "kafka",
            "message": str(e)
        }
