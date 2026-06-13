import pytest
import os
import asyncio
from httpx import AsyncClient

# Забезпечує доступ до конфігів та модулів бекенду
# В реальному середовищі на сервері змінні середовища
# будуть підтягуватись з secrets/configmaps

API_BASE_URL = os.getenv("API_BASE_URL", "http://core-api.predator.svc.cluster.local:8000/api/v1")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://predator-analytics-ui.predator.svc.cluster.local:3030")
REAL_EXCEL_FILE = os.getenv("REAL_EXCEL_FILE", "/tmp/Березень_2024.xlsx")

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def api_client():
    async with AsyncClient(base_url=API_BASE_URL, timeout=60.0) as client:
        yield client

@pytest.fixture(scope="session")
def db_config():
    return {
        "postgres": os.getenv("POSTGRES_DSN", "postgresql+asyncpg://predator:password@postgres:5432/predator"),
        "clickhouse": os.getenv("CLICKHOUSE_DSN", "clickhouse://default:password@clickhouse:9000/predator"),
        "neo4j": os.getenv("NEO4J_URI", "bolt://neo4j:7687"),
        "qdrant": os.getenv("QDRANT_URL", "http://qdrant:6333"),
        "opensearch": os.getenv("OPENSEARCH_URL", "https://opensearch:9200"),
        "redis": os.getenv("REDIS_URL", "redis://redis:6379/0"),
        "minio": os.getenv("MINIO_URL", "http://minio:9000")
    }

# Фікстура для зберігання міжтестового стану (наприклад, job_id, upload_time)
@pytest.fixture(scope="session")
def test_context():
    return {}
