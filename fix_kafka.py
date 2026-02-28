import logging

logger = logging.getLogger("app.services.kafka_service")

class KafkaService:
    async def publish_event(self, topic: str, data: dict):
        logger.info(f"Published event to {topic}: {data} (Mock)")
        return True

    async def send_message(self, topic: str, data: dict):
        return await self.publish_event(topic, data)

kafka_service = KafkaService()
