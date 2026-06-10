# libs/dve/checks/databases.py
"""Перевірка підключень до баз даних для DVE.
Надає функції `check_postgres`, `check_clickhouse`, `check_neo4j`, `check_redis`, `check_opensearch`, `check_qdrant`, `check_minio`.
Кожна функція повертає dict з полями `status` (OK/FAIL) та `details`.
"""

import os
import time
from typing import Dict

# PostgreSQL (asyncpg) – простий SELECT 1
async def check_postgres() -> Dict[str, str]:
    try:
        import asyncpg
        dsn = os.getenv("POSTGRES_DSN", "postgresql://postgres:password@localhost:5432/postgres")
        start = time.perf_counter()
        conn = await asyncpg.connect(dsn)
        await conn.execute("SELECT 1")
        await conn.close()
        latency = (time.perf_counter() - start) * 1000
        return {"status": "OK", "latency_ms": f"{latency:.2f}"}
    except Exception as e:
        return {"status": "FAIL", "error": str(e)}

# ClickHouse
def check_clickhouse() -> Dict[str, str]:
    try:
        from clickhouse_driver import Client
        host = os.getenv("CLICKHOUSE_HOST", "localhost")
        client = Client(host=host)
        start = time.perf_counter()
        client.execute("SELECT 1")
        latency = (time.perf_counter() - start) * 1000
        return {"status": "OK", "latency_ms": f"{latency:.2f}"}
    except Exception as e:
        return {"status": "FAIL", "error": str(e)}

# Neo4j
def check_neo4j() -> Dict[str, str]:
    try:
        from neo4j import GraphDatabase
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        pwd = os.getenv("NEO4J_PASSWORD", "password")
        driver = GraphDatabase.driver(uri, auth=(user, pwd))
        start = time.perf_counter()
        with driver.session() as session:
            session.run("RETURN 1")
        driver.close()
        latency = (time.perf_counter() - start) * 1000
        return {"status": "OK", "latency_ms": f"{latency:.2f}"}
    except Exception as e:
        return {"status": "FAIL", "error": str(e)}

# Redis
def check_redis() -> Dict[str, str]:
    try:
        import redis
        host = os.getenv("REDIS_HOST", "localhost")
        port = int(os.getenv("REDIS_PORT", "6379"))
        client = redis.StrictRedis(host=host, port=port, decode_responses=True)
        start = time.perf_counter()
        client.ping()
        latency = (time.perf_counter() - start) * 1000
        return {"status": "OK", "latency_ms": f"{latency:.2f}"}
    except Exception as e:
        return {"status": "FAIL", "error": str(e)}

# OpenSearch
def check_opensearch() -> Dict[str, str]:
    try:
        from opensearchpy import OpenSearch
        host = os.getenv("OPENSEARCH_HOST", "localhost")
        port = int(os.getenv("OPENSEARCH_PORT", "9200"))
        client = OpenSearch([{"host": host, "port": port}])
        start = time.perf_counter()
        client.cluster.health()
        latency = (time.perf_counter() - start) * 1000
        return {"status": "OK", "latency_ms": f"{latency:.2f}"}
    except Exception as e:
        return {"status": "FAIL", "error": str(e)}

# Qdrant
def check_qdrant() -> Dict[str, str]:
    try:
        from qdrant_client import QdrantClient
        host = os.getenv("QDRANT_HOST", "localhost")
        port = int(os.getenv("QDRANT_PORT", "6333"))
        client = QdrantClient(host=host, port=port)
        start = time.perf_counter()
        client.get_collections()
        latency = (time.perf_counter() - start) * 1000
        return {"status": "OK", "latency_ms": f"{latency:.2f}"}
    except Exception as e:
        return {"status": "FAIL", "error": str(e)}

# MinIO (S3 compatible) – boto3
def check_minio() -> Dict[str, str]:
    try:
        import boto3
        endpoint = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
        access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        s3 = boto3.client('s3', endpoint_url=endpoint,
                           aws_access_key_id=access_key,
                           aws_secret_access_key=secret_key)
        start = time.perf_counter()
        s3.list_buckets()
        latency = (time.perf_counter() - start) * 1000
        return {"status": "OK", "latency_ms": f"{latency:.2f}"}
    except Exception as e:
        return {"status": "FAIL", "error": str(e)}
