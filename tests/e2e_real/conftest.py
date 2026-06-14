"""Конфігурація E2E тестування імпорту Excel — PREDATOR Analytics v61.0-ELITE.

Фікстури для всіх 8 БД згідно System Memory Contract v4.0,
тестового Excel-файлу, AI RAG клієнта та контексту масового тестування.
Канонічна локалізація: УКРАЇНСЬКА (HR-03).
"""
import asyncio
import hashlib
import os
import time
from pathlib import Path
from typing import Any

import pytest
import pytest_asyncio
from httpx import AsyncClient

# ─── Змінні середовища ──────────────────────────────────────────────────────
API_BASE_URL: str = os.getenv(
    "API_BASE_URL",
    "http://core-api.predator.svc.cluster.local:8000/api/v1",
)
FRONTEND_URL: str = os.getenv(
    "FRONTEND_URL",
    "http://predator-analytics-ui.predator.svc.cluster.local:3030",
)
REAL_EXCEL_FILE: str = os.getenv(
    "REAL_EXCEL_FILE",
    "/tmp/Березень_2024.xlsx",
)
EXCEL_ARCHIVE_DIR: str = os.getenv(
    "EXCEL_ARCHIVE_DIR",
    "/tmp/excel_archive",
)
OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://ollama:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_REQUIRED_MODEL", "deepseek-r1:latest")

# ─── Таймаути (секунди) ────────────────────────────────────────────────────
ETL_TIMEOUT: int = int(os.getenv("E2E_ETL_TIMEOUT", "600"))
AI_QUERY_TIMEOUT: int = int(os.getenv("E2E_AI_QUERY_TIMEOUT", "120"))
BULK_FILE_TIMEOUT: int = int(os.getenv("E2E_BULK_FILE_TIMEOUT", "300"))


# ─── Event Loop ─────────────────────────────────────────────────────────────
# Видалено кастомну фікстуру event_loop.
# Для pytest-asyncio >= 0.23 використовуємо asyncio_default_fixture_loop_scope у pytest.ini.


# ─── HTTP Клієнти ───────────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="session")
async def api_client():
    """Async HTTP клієнт для Core API."""
    async with AsyncClient(base_url=API_BASE_URL, timeout=60.0) as client:
        yield client


@pytest_asyncio.fixture(scope="session")
async def ai_client():
    """Async HTTP клієнт для AI/RAG запитів (збільшений таймаут)."""
    async with AsyncClient(base_url=API_BASE_URL, timeout=float(AI_QUERY_TIMEOUT)) as client:
        yield client


@pytest_asyncio.fixture(scope="session")
async def ollama_client():
    """Async HTTP клієнт для прямого доступу до Ollama."""
    async with AsyncClient(base_url=OLLAMA_URL, timeout=float(AI_QUERY_TIMEOUT)) as client:
        yield client


# ─── Конфігурація БД ────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def db_config() -> dict[str, str]:
    """Централізована конфігурація підключень до всіх 8 БД."""
    return {
        "postgres": os.getenv(
            "POSTGRES_DSN",
            "postgresql://predator:predator_secret@postgres:5432/predator_db",
        ),
        "postgres_async": os.getenv(
            "POSTGRES_DSN_ASYNC",
            "postgresql+asyncpg://predator:predator_secret@postgres:5432/predator_db",
        ),
        "clickhouse_host": os.getenv("CLICKHOUSE_HOST", "clickhouse"),
        "clickhouse_port": int(os.getenv("CLICKHOUSE_PORT", "8123")),
        "clickhouse_user": os.getenv("CLICKHOUSE_USER", "default"),
        "clickhouse_password": os.getenv("CLICKHOUSE_PASSWORD", "predator_secret_ch"),
        "clickhouse_database": os.getenv("CLICKHOUSE_DATABASE", "predator_analytics"),
        "neo4j_uri": os.getenv("NEO4J_URI", "bolt://neo4j:7687"),
        "neo4j_user": os.getenv("NEO4J_USER", "neo4j"),
        "neo4j_password": os.getenv("NEO4J_PASSWORD", "predator_neo4j"),
        "qdrant_url": os.getenv("QDRANT_URL", "http://qdrant:6333"),
        "opensearch_url": os.getenv("OPENSEARCH_URL", "http://opensearch:9200"),
        "opensearch_user": os.getenv("OPENSEARCH_USER", "admin"),
        "opensearch_password": os.getenv("OPENSEARCH_PASSWORD", "admin"),
        "redis_url": os.getenv("REDIS_URL", "redis://redis:6379/0"),
        "minio_endpoint": os.getenv("MINIO_ENDPOINT", "minio:9000"),
        "minio_access_key": os.getenv("MINIO_ACCESS_KEY", "predator"),
        "minio_secret_key": os.getenv("MINIO_SECRET_KEY", "predator_secret"),
    }


# ─── PostgreSQL (asyncpg) ──────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="session")
async def pg_conn(db_config):
    """Async підключення до PostgreSQL через asyncpg."""
    try:
        import asyncpg

        conn = await asyncpg.connect(db_config["postgres"])
        yield conn
        await conn.close()
    except Exception as e:
        pytest.skip(f"PostgreSQL недоступний: {e}")


# ─── ClickHouse ─────────────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="session")
async def ch_client(db_config):
    """HTTP клієнт для ClickHouse REST API."""
    from httpx import AsyncClient, BasicAuth

    auth = BasicAuth(db_config["clickhouse_user"], db_config["clickhouse_password"])
    url = f"http://{db_config['clickhouse_host']}:{db_config['clickhouse_port']}"
    async with AsyncClient(base_url=url, auth=auth, timeout=30.0) as client:
        # Перевірка доступності
        try:
            resp = await client.get("/ping")
            if resp.status_code != 200:
                pytest.skip(f"ClickHouse недоступний: HTTP {resp.status_code}")
        except Exception as e:
            pytest.skip(f"ClickHouse недоступний: {e}")
        yield client


# ─── Neo4j ──────────────────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="session")
async def neo4j_driver(db_config):
    """Neo4j async driver."""
    try:
        from neo4j import AsyncGraphDatabase

        driver = AsyncGraphDatabase.driver(
            db_config["neo4j_uri"],
            auth=(db_config["neo4j_user"], db_config["neo4j_password"]),
        )
        # Перевірка підключення
        async with driver.session() as session:
            await session.run("RETURN 1")
        yield driver
        await driver.close()
    except Exception as e:
        pytest.skip(f"Neo4j недоступний: {e}")


# ─── Qdrant ─────────────────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="session")
async def qdrant_client_fixture(db_config):
    """Async HTTP клієнт для Qdrant REST API."""
    async with AsyncClient(base_url=db_config["qdrant_url"], timeout=15.0) as client:
        try:
            resp = await client.get("/collections")
            if resp.status_code != 200:
                pytest.skip(f"Qdrant недоступний: HTTP {resp.status_code}")
        except Exception as e:
            pytest.skip(f"Qdrant недоступний: {e}")
        yield client


# ─── OpenSearch ─────────────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="session")
async def opensearch_client(db_config):
    """Async HTTP клієнт для OpenSearch REST API."""
    from httpx import BasicAuth

    auth = BasicAuth(db_config["opensearch_user"], db_config["opensearch_password"])
    async with AsyncClient(
        base_url=db_config["opensearch_url"],
        auth=auth,
        timeout=15.0,
        verify=False,  # Самопідписаний сертифікат
    ) as client:
        try:
            resp = await client.get("/")
            if resp.status_code != 200:
                pytest.skip(f"OpenSearch недоступний: HTTP {resp.status_code}")
        except Exception as e:
            pytest.skip(f"OpenSearch недоступний: {e}")
        yield client


# ─── Redis ──────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def redis_client(db_config):
    """Синхронний Redis клієнт."""
    try:
        from redis import Redis

        client = Redis.from_url(db_config["redis_url"], decode_responses=True, socket_timeout=5)
        client.ping()
        yield client
        client.close()
    except Exception as e:
        pytest.skip(f"Redis недоступний: {e}")


# ─── MinIO ──────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def minio_client(db_config):
    """MinIO клієнт."""
    try:
        from minio import Minio

        client = Minio(
            db_config["minio_endpoint"],
            access_key=db_config["minio_access_key"],
            secret_key=db_config["minio_secret_key"],
            secure=False,
        )
        # Перевірка доступності
        client.list_buckets()
        yield client
    except Exception as e:
        pytest.skip(f"MinIO недоступний: {e}")


# ─── Excel файл ────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def excel_file_path() -> str:
    """Шлях до реального Excel-файлу."""
    path = REAL_EXCEL_FILE
    if not os.path.exists(path):
        pytest.skip(f"Excel-файл не знайдено: {path}")
    return path


@pytest.fixture(scope="session")
def excel_file_bytes(excel_file_path) -> bytes:
    """Вміст реального Excel-файлу у байтах."""
    with open(excel_file_path, "rb") as f:
        return f.read()


@pytest.fixture(scope="session")
def excel_file_hash(excel_file_bytes) -> str:
    """SHA-256 хеш реального Excel-файлу."""
    return hashlib.sha256(excel_file_bytes).hexdigest()


@pytest.fixture(scope="session")
def excel_file_metadata(excel_file_path, excel_file_bytes, excel_file_hash) -> dict[str, Any]:
    """Метадані реального Excel-файлу."""
    import pandas as pd

    xls = pd.ExcelFile(excel_file_path, engine="openpyxl")
    sheets_info = {}
    total_rows = 0
    for sheet in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet)
        sheets_info[sheet] = {
            "rows": len(df),
            "columns": list(df.columns),
            "column_count": len(df.columns),
        }
        total_rows += len(df)

    return {
        "file_name": os.path.basename(excel_file_path),
        "file_size": len(excel_file_bytes),
        "sha256": excel_file_hash,
        "sheet_count": len(xls.sheet_names),
        "sheet_names": xls.sheet_names,
        "sheets": sheets_info,
        "total_rows": total_rows,
    }


# ─── Архів 96 файлів ───────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def excel_archive_files() -> list[str]:
    """Список шляхів до всіх Excel-файлів в архіві."""
    archive_dir = Path(EXCEL_ARCHIVE_DIR)
    if not archive_dir.exists():
        pytest.skip(f"Архів Excel-файлів не знайдено: {EXCEL_ARCHIVE_DIR}")

    files = sorted(
        [str(f) for f in archive_dir.glob("*.xlsx")]
        + [str(f) for f in archive_dir.glob("*.xls")]
    )
    if not files:
        pytest.skip(f"В архіві {EXCEL_ARCHIVE_DIR} не знайдено Excel-файлів")
    return files


# ─── Міжтестовий контекст ───────────────────────────────────────────────────
@pytest.fixture(scope="session")
def test_context() -> dict[str, Any]:
    """Зберігає міжтестовий стан: job_id, upload_time, метрики."""
    return {
        "upload_completed": False,
        "job_id": None,
        "upload_start_time": None,
        "etl_duration_seconds": None,
        "records_processed": 0,
        "records_errors": 0,
        "records_quarantined": 0,
        "db_counts": {},
        "ai_query_results": [],
        "bulk_results": [],
        "bulk_start_time": None,
        "bulk_total_records": 0,
    }


# ─── Генератор звітів ──────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def report_collector() -> dict[str, Any]:
    """Збирає результати всіх етапів для фінального звіту."""
    return {
        "start_time": time.time(),
        "stages": {},
        "errors": [],
        "warnings": [],
        "dri_checks": {},
    }


# ─── Pytest Markers ────────────────────────────────────────────────────────
def pytest_configure(config):
    """Реєстрація кастомних маркерів."""
    config.addinivalue_line("markers", "stage1_ui: Етап 1 — UI DOM-аудит")
    config.addinivalue_line("markers", "stage2_accept: Етап 2 — Приймання файлу")
    config.addinivalue_line("markers", "stage3_etl: Етап 3 — ETL обробка")
    config.addinivalue_line("markers", "stage4_storage: Етап 4 — Запис до сховищ")
    config.addinivalue_line("markers", "stage5_representations: Етап 5 — Побудова представлень")
    config.addinivalue_line("markers", "stage6_ai: Етап 6 — AI-підсистема")
    config.addinivalue_line("markers", "stage7_queries: Етап 7 — Запити користувача")
    config.addinivalue_line("markers", "stage8_ui_verify: Етап 8 — Відображення у UI")
    config.addinivalue_line("markers", "stage9_bulk: Етап 9 — Масове тестування")
    config.addinivalue_line("markers", "stage10_report: Етап 10 — Фінальний звіт")
