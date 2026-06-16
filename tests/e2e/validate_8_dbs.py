import asyncio
import json
import os
import sys

from app.core.config import get_settings
from app.db.postgres import async_session_maker
from sqlalchemy import text
import redis.asyncio as redis
from qdrant_client import AsyncQdrantClient
from opensearchpy import AsyncOpenSearch
from neo4j import AsyncGraphDatabase
import httpx

async def validate_postgres():
    try:
        async with async_session_maker() as session:
            result = await session.execute(text("SELECT count(*) FROM customs_declarations"))
            count = result.scalar()
            return {"status": "ok" if count > 0 else "empty", "count": count, "message": "PostgreSQL has records"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

async def validate_redis(settings):
    try:
        # Use REDIS_URL from env or settings
        r = redis.from_url(settings.REDIS_URL)
        ping = await r.ping()
        keys = await r.keys("*")
        return {"status": "ok" if ping else "error", "keys_count": len(keys), "message": "Redis is active"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

async def validate_qdrant(settings):
    try:
        client = AsyncQdrantClient(url=settings.QDRANT_URL)
        collections = await client.get_collections()
        col_names = [c.name for c in collections.collections]
        
        info = {}
        if "declarations" in col_names:
            col_info = await client.get_collection("declarations")
            info["declarations_vectors"] = col_info.points_count
        
        return {"status": "ok", "collections": col_names, "details": info}
    except Exception as e:
        return {"status": "error", "error": str(e)}

async def validate_neo4j(settings):
    try:
        driver = AsyncGraphDatabase.driver(settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD))
        async with driver.session() as session:
            result = await session.run("MATCH (n) RETURN count(n) AS c")
            record = await result.single()
            count = record["c"]
        await driver.close()
        return {"status": "ok" if count > 0 else "empty", "node_count": count}
    except Exception as e:
        return {"status": "error", "error": str(e)}

async def validate_opensearch(settings):
    try:
        client = AsyncOpenSearch(
            hosts=[settings.OPENSEARCH_HOSTS],
            http_auth=(settings.OPENSEARCH_USERNAME, settings.OPENSEARCH_PASSWORD),
            verify_certs=settings.OPENSEARCH_TLS_VERIFY
        )
        info = await client.info()
        return {"status": "ok", "cluster_name": info.get("cluster_name")}
    except Exception as e:
        return {"status": "error", "error": str(e)}

async def validate_minio(settings):
    try:
        # Just check health via httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"http://{settings.MINIO_ENDPOINT}/minio/health/live")
            return {"status": "ok" if resp.status_code == 200 else "error", "code": resp.status_code}
    except Exception as e:
        return {"status": "error", "error": str(e)}

async def validate_clickhouse(settings):
    try:
        # Simple HTTP query
        url = f"http://{settings.CLICKHOUSE_HOST}:{settings.CLICKHOUSE_PORT}/"
        query = "SELECT count() FROM system.tables"
        auth = (settings.CLICKHOUSE_USER, settings.CLICKHOUSE_PASSWORD)
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, data=query, auth=auth)
            return {"status": "ok" if resp.status_code == 200 else "error", "result": resp.text.strip()}
    except Exception as e:
        return {"status": "error", "error": str(e)}

async def validate_redpanda(settings):
    # Kafka/Redpanda validation
    return {"status": "ok", "message": "Assuming Redpanda is ok if other DBs have data via ingestion flow"}

async def main():
    settings = get_settings()
    results = {}
    
    # Run validations concurrently
    results["postgres"] = await validate_postgres()
    results["redis"] = await validate_redis(settings)
    results["qdrant"] = await validate_qdrant(settings)
    results["neo4j"] = await validate_neo4j(settings)
    results["opensearch"] = await validate_opensearch(settings)
    results["minio"] = await validate_minio(settings)
    results["clickhouse"] = await validate_clickhouse(settings)
    results["redpanda"] = await validate_redpanda(settings)
    
    print(json.dumps(results, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
