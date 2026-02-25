import logging

logger = logging.getLogger("app.services.kafka_service")

class KafkaService:
    async def publish_event(self, topic: str, data: dict):
        logger.info(f"Published event to {topic}: {data} (Mock)")
        return True

kafka_service = KafkaService()
