"""Entry point для Federation Search Service."""

import asyncio
import logging
import os

from app.federation_search import FederationSearch

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def main() -> None:
    """Запускає Federation Search Service."""
    postgres_url = os.getenv(
        "POSTGRES_URL",
        "postgresql://predator:predator@localhost:5432/predator",
    )
    clickhouse_url = os.getenv(
        "CLICKHOUSE_URL",
        "clickhouse://default:@localhost:8123/predator",
    )
    opensearch_url = os.getenv(
        "OPENSEARCH_URL",
        "http://localhost:9200",
    )
    qdrant_url = os.getenv(
        "QDRANT_URL",
        "http://localhost:6333",
    )
    neo4j_url = os.getenv(
        "NEO4J_URL",
        "bolt://localhost:7687",
    )

    search_service = FederationSearch(
        postgres_url=postgres_url,
        clickhouse_url=clickhouse_url,
        opensearch_url=opensearch_url,
        qdrant_url=qdrant_url,
        neo4j_url=neo4j_url,
    )

    try:
        # TODO: Запуск FastAPI/GrPC сервера
        logger.info("Federation Search Service запущено (placeholder)")
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Отримано сигнал завершення")
    except Exception as e:
        logger.error(f"Помилка Federation Search Service: {e}", exc_info=True)
    finally:
        await search_service.close()


if __name__ == "__main__":
    asyncio.run(main())
