import asyncio
import logging
from sqlalchemy import text
import redis.asyncio as redis
from neo4j import AsyncGraphDatabase
import httpx
from aiokafka import AIOKafkaConsumer

from app.config import get_settings
from app.database import init_db, close_db
import app.database as db

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

settings = get_settings()

async def check_postgres():
    try:
        init_db()
        async def _query():
            async with db.engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        await asyncio.wait_for(_query(), timeout=5.0)
        logger.info("✅ PostgreSQL (SSOT): OK")
    except Exception as e:
        logger.error(f"❌ PostgreSQL: Failed - {e}")
    finally:
        try:
            await asyncio.wait_for(close_db(), timeout=5.0)
        except Exception:
            pass

async def check_redis():
    try:
        r = redis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.close()
        logger.info("✅ Redis (Cache): OK")
    except Exception as e:
        logger.error(f"❌ Redis: Failed - {e}")

async def check_neo4j():
    try:
        driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )
        async with driver.session() as session:
            await session.run("RETURN 1")
        await driver.close()
        logger.info("✅ Neo4j (Graph): OK")
    except Exception as e:
        logger.error(f"❌ Neo4j: Failed - {e}")

async def check_opensearch():
    try:
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.get(
                settings.OPENSEARCH_HOSTS,
                auth=(settings.OPENSEARCH_USERNAME, settings.OPENSEARCH_PASSWORD)
            )
            resp.raise_for_status()
        logger.info("✅ OpenSearch (Search): OK")
    except Exception as e:
        logger.error(f"❌ OpenSearch: Failed - {e}")

async def check_qdrant():
    try:
        qdrant_url = getattr(settings, 'QDRANT_URL', 'http://192.168.0.114:6333')
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{qdrant_url}/collections")
            resp.raise_for_status()
        logger.info("✅ Qdrant (Vector): OK")
    except Exception as e:
        logger.error(f"❌ Qdrant: Failed - {e}")

async def check_kafka():
    try:
        brokers = getattr(settings, 'KAFKA_BROKERS', '192.168.0.114:9092')
        # Hardcode 'redpanda:9092' if running inside docker on the server
        brokers = 'redpanda:9092'
        consumer = AIOKafkaConsumer(
            bootstrap_servers=brokers,
            request_timeout_ms=3000,
            metadata_max_age_ms=3000
        )
        await asyncio.wait_for(consumer.start(), timeout=5.0)
        await asyncio.wait_for(consumer.stop(), timeout=5.0)
        logger.info("✅ Kafka (Events): OK")
    except Exception as e:
        logger.error(f"❌ Kafka: Failed - {repr(e)}")

async def check_minio():
    try:
        minio_endpoint = getattr(settings, 'MINIO_ENDPOINT', '192.168.0.114:9000')
        minio_url = f"http://{minio_endpoint}/minio/health/live"
        async with httpx.AsyncClient() as client:
            resp = await client.get(minio_url)
            resp.raise_for_status()
        logger.info("✅ MinIO (Storage): OK")
    except Exception as e:
        logger.error(f"❌ MinIO: Failed - {e}")

async def check_clickhouse():
    try:
        ch_host = getattr(settings, 'CLICKHOUSE_HOST', '192.168.0.114')
        ch_port = getattr(settings, 'CLICKHOUSE_PORT', 8123)
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"http://{ch_host}:{ch_port}/ping")
            resp.raise_for_status()
        logger.info("✅ ClickHouse (OLAP): OK")
    except Exception as e:
        logger.error(f"❌ ClickHouse: Failed - {e}")

async def main():
    logger.info("Starting infrastructure connection checks...")
    results = await asyncio.gather(
        check_postgres(),
        check_redis(),
        check_neo4j(),
        check_opensearch(),
        check_qdrant(),
        check_kafka(),
        check_minio(),
        check_clickhouse(),
        return_exceptions=True
    )
    for res in results:
        if isinstance(res, Exception):
            logger.error(f"Task failed with exception: {repr(res)}")
    logger.info("Infrastructure checks completed.")

if __name__ == "__main__":
    asyncio.run(main())
