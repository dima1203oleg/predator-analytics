import httpx
from redis import Redis
import os
from minio import Minio

# Конфігурація з env або fallback на localhost
CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "194.177.1.240")
CLICKHOUSE_PORT = os.getenv("CLICKHOUSE_PORT", "8123")
CLICKHOUSE_PASSWORD = os.getenv("CLICKHOUSE_PASSWORD", "predator_secret_ch")

NEO4J_URI = os.getenv("NEO4J_URI", "http://194.177.1.240:7474")
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
        ch_url = f"http://{CLICKHOUSE_HOST}:{CLICKHOUSE_PORT}/"
        ch_auth = httpx.BasicAuth("default", CLICKHOUSE_PASSWORD)
        async with httpx.AsyncClient(timeout=10, auth=ch_auth) as client:
            ch_query = f"SELECT COUNT() FROM predator_analytics.customs_declarations WHERE tenant_id = '{tenant_id}'"
            response = await client.post(ch_url, content=ch_query)
            if response.status_code == 200:
                return int(response.text.strip())
            raise Exception(f"ClickHouse Error: {response.text}")

    @staticmethod
    async def get_neo4j_nodes_count(tenant_id: str) -> int:
        neo_url = f"{NEO4J_URI}/db/neo4j/tx/commit"
        auth = httpx.BasicAuth(NEO4J_USER, NEO4J_PASSWORD)
        async with httpx.AsyncClient(timeout=10) as client:
            payload = {
                "statements": [
                    {
                        "statement": "MATCH (c:Company {tenant_id: $tenant_id}) RETURN count(c) as count",
                        "parameters": {"tenant_id": tenant_id}
                    }
                ]
            }
            response = await client.post(neo_url, json=payload, auth=auth)
            if response.status_code == 200:
                data = response.json()
                if data.get("errors"):
                    raise Exception(f"Neo4j Error: {data['errors']}")
                return data["results"][0]["data"][0]["row"][0]
            raise Exception(f"Neo4j HTTP Error: {response.status_code}")

    @staticmethod
    async def get_qdrant_collections() -> list:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{QDRANT_URL}/collections")
            if response.status_code == 200:
                return [c["name"] for c in response.json().get("result", {}).get("collections", [])]
            raise Exception(f"Qdrant Error: {response.text}")

    @staticmethod
    async def get_opensearch_indices() -> list:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{OPENSEARCH_HOST}/_cat/indices?format=json")
            if response.status_code == 200:
                return [idx["index"] for idx in response.json()]
            raise Exception(f"OpenSearch Error: {response.text}")

    @staticmethod
    def get_redis_keys_count() -> int:
        redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
        return redis_client.dbsize()

    @staticmethod
    def get_minio_objects_count(bucket_name: str) -> int:
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
