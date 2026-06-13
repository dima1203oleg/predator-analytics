import httpx
import os
import asyncio
from redis.asyncio import Redis
from minio import Minio
import clickhouse_connect
from neo4j import AsyncGraphDatabase
from qdrant_client import AsyncQdrantClient
from opensearchpy import AsyncOpenSearch

# Конфігурація з env або fallback на localhost
CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "194.177.1.240")
CLICKHOUSE_PORT = int(os.getenv("CLICKHOUSE_PORT", "8123"))
CLICKHOUSE_USER = os.getenv("CLICKHOUSE_USER", "default")
CLICKHOUSE_PASSWORD = os.getenv("CLICKHOUSE_PASSWORD", "predator_secret_ch")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://194.177.1.240:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "predator_secret_graph")

QDRANT_URL = os.getenv("QDRANT_URL", "http://194.177.1.240:6333")

OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOSTS", "http://194.177.1.240:9200")

REDIS_URL = os.getenv("REDIS_URL", "redis://194.177.1.240:6379/0")

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "194.177.1.240:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "predator_admin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "predator_secret_s3")

class MultiDBClient:
    """Клієнт для доступу до всіх сховищ даних в межах E2E тестів."""

    @staticmethod
    async def get_clickhouse_count(tenant_id: str) -> int:
        try:
            client = clickhouse_connect.get_client(
                host=CLICKHOUSE_HOST, 
                port=CLICKHOUSE_PORT, 
                username=CLICKHOUSE_USER, 
                password=CLICKHOUSE_PASSWORD
            )
            # Use format parameter for safe query
            result = client.command(
                "SELECT count() FROM predator_analytics.customs_declarations WHERE tenant_id = %(tenant_id)s",
                parameters={"tenant_id": tenant_id}
            )
            return int(result)
        except Exception as e:
            # Fallback for when the DB/table doesn't exist yet
            print(f"ClickHouse Warning: {e}")
            return 0

    @staticmethod
    async def get_neo4j_nodes_count(tenant_id: str) -> int:
        try:
            driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
            async with driver.session() as session:
                result = await session.run(
                    "MATCH (c:Company {tenant_id: $tenant_id}) RETURN count(c) as count",
                    tenant_id=tenant_id
                )
                record = await result.single()
                count = record["count"] if record else 0
            await driver.close()
            return count
        except Exception as e:
            print(f"Neo4j Warning: {e}")
            return 0

    @staticmethod
    async def get_qdrant_collections() -> list:
        try:
            client = AsyncQdrantClient(url=QDRANT_URL)
            response = await client.get_collections()
            return [c.name for c in response.collections]
        except Exception as e:
            print(f"Qdrant Warning: {e}")
            return []

    @staticmethod
    async def get_opensearch_indices() -> list:
        try:
            client = AsyncOpenSearch(hosts=[OPENSEARCH_HOST])
            indices = await client.cat.indices(format="json")
            await client.close()
            return [idx["index"] for idx in indices]
        except Exception as e:
            print(f"OpenSearch Warning: {e}")
            return []

    @staticmethod
    async def get_redis_keys_count() -> int:
        try:
            redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
            size = await redis_client.dbsize()
            await redis_client.aclose()
            return size
        except Exception as e:
            print(f"Redis Warning: {e}")
            return 0

    @staticmethod
    def get_minio_objects_count(bucket_name: str) -> int:
        try:
            client = Minio(
                MINIO_ENDPOINT,
                access_key=MINIO_ACCESS_KEY,
                secret_key=MINIO_SECRET_KEY,
                secure=False
            )
            if client.bucket_exists(bucket_name):
                objects = client.list_objects(bucket_name, recursive=True)
                return len(list(objects))
            return 0
        except Exception as e:
            print(f"MinIO Warning: {e}")
            return 0
