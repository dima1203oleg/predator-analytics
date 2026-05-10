"""Entry point для CDC Service."""

import asyncio
import logging
import os

from app.cdc_pipeline import CDCPipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def main() -> None:
    """Запускає CDC Service."""
    postgres_url = os.getenv(
        "POSTGRES_URL",
        "postgresql://predator:predator@localhost:5432/predator",
    )
    kafka_bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    kafka_topic = os.getenv("KAFKA_TOPIC_CDC", "predator.cdc.declarations")

    pipeline = CDCPipeline(
        postgres_url=postgres_url,
        kafka_bootstrap_servers=kafka_bootstrap_servers,
        kafka_topic=kafka_topic,
    )

    try:
        await pipeline.run()
    except KeyboardInterrupt:
        logger.info("Отримано сигнал завершення")
    except Exception as e:
        logger.error(f"Помилка CDC Service: {e}", exc_info=True)


if __name__ == "__main__":
    asyncio.run(main())
