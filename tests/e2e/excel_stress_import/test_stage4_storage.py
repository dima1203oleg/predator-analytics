import pytest
import os
import aiohttp
from sqlalchemy import text

# Використовуємо існуючу фікстуру db_session з conftest.py
pytestmark = pytest.mark.asyncio

API_BASE_URL = os.getenv("PREDATOR_API_URL", "http://localhost:8000/api/v1")

@pytest.mark.e2e
async def test_stage4_postgres_verification(db_session, test_tenant_id):
    """Перевірка PostgreSQL: транзакції та метадані WORM"""
    job_id = os.environ.get("CURRENT_JOB_ID")
    if not job_id:
        pytest.skip("Немає JOB_ID")

    result = await db_session.execute(text("SELECT status FROM ingestion_jobs WHERE id = :job_id"), {"job_id": job_id})
    row = result.fetchone()
    assert row is not None
    assert row[0] == "COMPLETED"

@pytest.mark.e2e
async def test_stage4_clickhouse_verification():
    """Перевірка ClickHouse: аналітичний масив"""
    # Симуляція запиту до ClickHouse через API
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_BASE_URL}/analytics/declarations/count") as resp:
            data = await resp.json()
            assert data.get("total_count", 0) > 0

@pytest.mark.e2e
async def test_stage4_neo4j_verification():
    """Перевірка Neo4j: побудова графових зв'язків"""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_BASE_URL}/graph/nodes/count") as resp:
            data = await resp.json()
            assert data.get("companies_count", 0) > 0

@pytest.mark.e2e
async def test_stage4_qdrant_opensearch_verification():
    """Перевірка Qdrant (Embeddings) та OpenSearch (Full Text)"""
    async with aiohttp.ClientSession() as session:
        # Пошук щойно доданої компанії або митного коду
        query = {"query": "ТОВ Тест", "use_vector": True}
        async with session.post(f"{API_BASE_URL}/search/hybrid", json=query) as resp:
            data = await resp.json()
            assert "results" in data
            # Перевіряємо що індекс відпрацював
            assert isinstance(data["results"], list)

@pytest.mark.e2e
async def test_stage4_minio_verification():
    """Перевірка MinIO: збереження оригіналу файлу"""
    async with aiohttp.ClientSession() as session:
        job_id = os.environ.get("CURRENT_JOB_ID")
        async with session.get(f"{API_BASE_URL}/ingestion/jobs/{job_id}/artifact") as resp:
            # Маємо отримати лінк або метадані артефакту
            assert resp.status == 200
            data = await resp.json()
            assert "s3_path" in data
            assert data["s3_path"].endswith(".xlsx")
