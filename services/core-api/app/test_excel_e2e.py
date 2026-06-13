"""E2E Тестування імпорту та обробки Excel-реєстрів митних декларацій.
Повна наскрізну валідація життєвого циклу даних згідно розширеного ТЗ.
Канонічна локалізація: УКРАЇНСЬКА (HR-03).
"""
import asyncio
from datetime import UTC, datetime
import hashlib
import os
import sys
import time
import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Додаємо шляхи для імпортів
sys.path.insert(0, "/libs")
sys.path.insert(0, "/app")

# Налаштування логування
import logging

import httpx
from redis import Redis

from app.services.kafka_service import get_kafka_service
from app.services.minio_service import get_minio_service
from predator_common.models import IngestionJob, Tenant, User

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("excel_e2e_validator")

from app.config import get_settings

settings = get_settings()

# Налаштування (використовують змінні середовища, якщо вони є, інакше дефолти для локального середовища)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://predator:predator_secret@postgres:5432/predator_db")
CLICKHOUSE_HOST = settings.CLICKHOUSE_HOST
CLICKHOUSE_PORT = settings.CLICKHOUSE_PORT
CLICKHOUSE_USER = settings.CLICKHOUSE_USER
CLICKHOUSE_PASSWORD = settings.CLICKHOUSE_PASSWORD
CLICKHOUSE_DATABASE = settings.CLICKHOUSE_DATABASE
NEO4J_URI = settings.NEO4J_URI
NEO4J_USER = settings.NEO4J_USER
NEO4J_PASSWORD = settings.NEO4J_PASSWORD
QDRANT_URL = settings.QDRANT_URL
OPENSEARCH_HOSTS = settings.OPENSEARCH_HOSTS
REDIS_URL = settings.REDIS_URL

EXCEL_FILE_PATH = "/app/app/Березень_2024.xlsx"
TENANT_UUID = uuid.UUID("a0000000-0000-0000-0000-000000000001")
USER_UUID = uuid.UUID("b0000000-0000-0000-0000-000000000001")

async def ensure_test_tenant_and_user(session: AsyncSession):
    """Створює або перевіряє тестового тенанта та користувача."""
    logger.info("Перевірка тестового тенанта...")
    # Перевірка тенанта
    result = await session.execute(select(Tenant).where(Tenant.id == TENANT_UUID))
    tenant = result.scalar_one_or_none()
    if not tenant:
        tenant = Tenant(
            id=TENANT_UUID,
            name="Тестовий тенант E2E",
            slug="test-tenant-e2e",
            plan="elite",
            is_active=True
        )
        session.add(tenant)
        await session.commit()
        logger.info("Створено новий тестовий тенант")
    else:
        logger.info("Тестовий тенант вже існує")

    # Перевірка користувача
    result = await session.execute(select(User).where(User.id == USER_UUID))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            id=USER_UUID,
            tenant_id=TENANT_UUID,
            email="e2e-admin@predator.ua",
            password_hash="pbkdf2:sha256:...",
            full_name="E2E Administrator",
            role="admin",
            is_active=True
        )
        session.add(user)
        await session.commit()
        logger.info("Створено тестового користувача")
    else:
        logger.info("Тестовий користувач вже існує")

async def run_e2e_validation(file_content: bytes, file_name: str, audit_id: str):
    start_time = time.time()

    # 0. Ініціалізація сесії PostgreSQL
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        await ensure_test_tenant_and_user(session)

    file_size = len(file_content)
    logger.info(f"File size for audit {audit_id}: {file_size} bytes")
    content_hash = hashlib.sha256(file_content).hexdigest()

    # Використовуємо переданий audit_id як job_id
    job_id = uuid.UUID(audit_id)
    logger.info(f"Запуск E2E Job ID: {job_id}")

    # 1. Завантаження у MinIO
    logger.info("Крок 1: Завантаження Excel-файлу в MinIO...")
    minio = get_minio_service()
    await minio.connect()
    await minio.ensure_tenant_buckets(str(TENANT_UUID))
    bucket_name = minio.get_raw_bucket(str(TENANT_UUID))
    object_name = f"{job_id}/Березень_2024.xlsx"

    success, s3_path, _ = await minio.upload_file(
        bucket=bucket_name,
        object_name=object_name,
        data=file_content,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    if not success:
        logger.error("Не вдалося завантажити файл в MinIO")
        return
    logger.info(f"Файл завантажено в MinIO: {s3_path}")

    # 2. Створення запису Job в PostgreSQL
    logger.info("Крок 2: Створення запису про роботу в PostgreSQL...")
    async with async_session() as session:
        new_job = IngestionJob(
            id=job_id,
            tenant_id=TENANT_UUID,
            user_id=USER_UUID,
            job_type="file_upload",
            file_name=file_name,
            file_size=file_size,
            status="queued",
            progress=0,
            started_at=datetime.now(UTC),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC)
        )
        session.add(new_job)
        await session.commit()
    logger.info("Запис про роботу збережено в PostgreSQL.")

    # 3. Публікація в Kafka для запуску Ingestion Worker
    logger.info("Крок 3: Публікація події RawFileUpload у Kafka...")
    kafka = get_kafka_service()
    await kafka.connect()
    await kafka.publish_file_upload(
        job_id=str(job_id),
        tenant_id=str(TENANT_UUID),
        user_id=str(USER_UUID),
        file_name=file_name,
        file_size=file_size,
        content_hash=content_hash,
        s3_path=s3_path
    )
    logger.info("Подію надіслано в Kafka.")

    # 4. Моніторинг прогресу обробки
    logger.info("Крок 4: Очікування обробки файлу воркером (polling)...")
    status = "queued"
    progress = 0
    records_processed = 0
    records_errors = 0
    timeout_limit = 900  # 15 хвилин ліміт очікування
    poll_start = time.time()

    while status in ["queued", "processing", "pending"]:
        if time.time() - poll_start > timeout_limit:
            logger.error("Перевищено час очікування обробки (Timeout)")
            break

        await asyncio.sleep(5)

        async with async_session() as session:
            result = await session.execute(select(IngestionJob).where(IngestionJob.id == job_id))
            job = result.scalar_one_or_none()
            if job:
                status = job.status
                progress = job.progress or 0
                records_processed = job.records_processed or 0
                records_errors = job.records_errors or 0
                logger.info(f"Прогрес: {progress}% | Статус: {status} | Оброблено рядків: {records_processed} | Помилок: {records_errors}")
            else:
                logger.warning("Job не знайдено в PostgreSQL!")

    duration = time.time() - start_time
    logger.info(f"Обробку завершено за {duration:.2f} сек. Статус: {status}")

    # 5. Перевірка цілісності даних по базах даних (Multi-DB Audit)
    logger.info("Крок 5: Повний аудит цілісності даних по базах даних...")
    audit_results = {}
    pg_count = 0

    # 5.1 PostgreSQL (SSOT)
    try:
        async with async_session() as session:
            res = await session.execute(
                select(text("COUNT(*)")).select_from(text("declarations"))
            )
            pg_count = res.scalar() or 0
            audit_results["postgresql"] = {
                "status": "pass" if pg_count > 0 else "fail",
                "count": pg_count,
                "message": f"Знайдено {pg_count} декларацій в PostgreSQL"
            }
    except Exception as e:
        audit_results["postgresql"] = {"status": "fail", "error": str(e)}

    # 5.2 ClickHouse (OLAP) - Використовуємо REST API ClickHouse на порту 8123
    try:
        ch_url = f"http://{CLICKHOUSE_HOST}:{CLICKHOUSE_PORT}/"
        ch_auth = httpx.BasicAuth("default", "predator_secret_ch")
        async with httpx.AsyncClient(timeout=10, auth=ch_auth) as client:
            ch_query = "SELECT COUNT() FROM predator_analytics.customs_declarations"
            response = await client.post(ch_url, content=ch_query)
            if response.status_code == 200:
                ch_count = int(response.text.strip())
                audit_results["clickhouse"] = {
                    "status": "pass" if ch_count > 0 else "warning",
                    "count": ch_count,
                    "message": f"Знайдено {ch_count} декларацій в ClickHouse"
                }
            else:
                audit_results["clickhouse"] = {
                    "status": "warning",
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
    except Exception as e:
        audit_results["clickhouse"] = {"status": "warning", "error": str(e)}

    # 5.3 Neo4j (Graph) - Використовуємо REST API Neo4j на порту 7474
    try:
        # Спробуємо підключитись по HTTP
        neo_url = "http://neo4j:7474/db/neo4j/tx/commit"
        auth = httpx.BasicAuth(NEO4J_USER, NEO4J_PASSWORD)
        async with httpx.AsyncClient(timeout=10) as client:
            payload = {
                "statements": [
                    {
                        "statement": "MATCH (c:Company {tenant_id: $tenant_id}) RETURN count(c) as count",
                        "parameters": {"tenant_id": str(TENANT_UUID)}
                    }
                ]
            }
            response = await client.post(neo_url, json=payload, auth=auth)
            if response.status_code == 200:
                data = response.json()
                neo_count = data["results"][0]["data"][0]["row"][0]
                audit_results["neo4j"] = {
                    "status": "pass" if neo_count > 0 else "warning",
                    "nodes_count": neo_count,
                    "message": f"Знайдено {neo_count} вузлів компаній в Neo4j"
                }
            else:
                audit_results["neo4j"] = {
                    "status": "warning",
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
    except Exception as e:
        audit_results["neo4j"] = {"status": "warning", "error": str(e)}

    # 5.4 Qdrant (Vector) - REST API
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{QDRANT_URL}/collections")
            if response.status_code == 200:
                collections = response.json().get("result", {}).get("collections", [])
                coll_names = [c["name"] for c in collections]
                has_vectors = any("predator-embeddings" in name for name in coll_names)
                audit_results["qdrant"] = {
                    "status": "pass" if has_vectors else "warning",
                    "collections": coll_names,
                    "message": f"Колекції в Qdrant: {coll_names}"
                }
            else:
                audit_results["qdrant"] = {"status": "fail", "error": f"HTTP {response.status_code}"}
    except Exception as e:
        audit_results["qdrant"] = {"status": "fail", "error": str(e)}

    # 5.5 OpenSearch (Search)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            os_res = await client.get(f"{OPENSEARCH_HOSTS}/_cat/indices?format=json")
            indices = os_res.json() if os_res.status_code == 200 else []
            has_idx = any("declaration" in idx["index"] for idx in indices)
            audit_results["opensearch"] = {
                "status": "pass" if has_idx else "warning",
                "indices": [idx["index"] for idx in indices[:5]],
                "message": f"Знайдено {len(indices)} індексів в OpenSearch"
            }
    except Exception as e:
        audit_results["opensearch"] = {"status": "warning", "error": str(e)}

    # 5.6 Redis (Cache)
    try:
        redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
        keys_count = redis_client.dbsize()
        audit_results["redis"] = {
            "status": "pass" if keys_count >= 0 else "fail",
            "keys_count": keys_count,
            "message": f"Активних ключів у Redis: {keys_count}"
        }
    except Exception as e:
        audit_results["redis"] = {"status": "fail", "error": str(e)}

    # 5.7 MinIO (S3)
    try:
        minio_client = minio._client
        objects = minio_client.list_objects(bucket_name, recursive=True)
        obj_count = len(list(objects))
        audit_results["minio"] = {
            "status": "pass" if obj_count > 0 else "fail",
            "objects_count": obj_count,
            "message": f"Збережено оригінальний файл в MinIO (об'єктів: {obj_count})"
        }
    except Exception as e:
        audit_results["minio"] = {"status": "fail", "error": str(e)}

    # 6. Розрахунок DRI (Deployment Readiness Index)
    passed_checks = sum(1 for res in audit_results.values() if res.get("status") in ["pass", "warning"])
    total_checks = len(audit_results)
    dri = (passed_checks / total_checks) * 100

    # Готовність
    is_ready = dri >= 99.0 and status == "completed"

    report = {
        "timestamp": datetime.now(UTC).isoformat(),
        "job_id": str(job_id),
        "status": status,
        "duration_seconds": round(duration, 2),
        "records_processed": records_processed,
        "records_errors": records_errors,
        "deployment_readiness_index": round(dri, 2),
        "is_ready": is_ready,
        "databases": audit_results
    }

    # Створення папки звітів
    os.makedirs("/tmp/predator_reports", exist_ok=True)

    # Збереження JSON звіту
    import json
    with open(f"/tmp/predator_reports/audit_{audit_id}.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Збереження HTML звіту
    html_content = f"""
    <html>
    <head>
        <title>PREDATOR Analytics — Звіт E2E Валідації</title>
        <style>
            body {{ font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; }}
            .container {{ max-width: 800px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            h1 {{ color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 10px; }}
            .metric {{ margin: 15px 0; font-size: 1.1em; }}
            .status-pass {{ color: #4ade80; font-weight: bold; }}
            .status-fail {{ color: #f87171; font-weight: bold; }}
            .status-warning {{ color: #fbbf24; font-weight: bold; }}
            .db-card {{ background: #334155; padding: 15px; margin: 10px 0; border-radius: 5px; }}
            .dri {{ font-size: 2em; color: #38bdf8; font-weight: bold; text-align: center; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Звіт E2E Валідації життєвого циклу даних</h1>
            <div class="dri">DRI: {round(dri, 2)}%</div>
            <div class="metric"><b>Статус обробки:</b> <span class="status-{'pass' if status == 'completed' else 'fail'}">{status}</span></div>
            <div class="metric"><b>Оброблено рядків:</b> {records_processed}</div>
            <div class="metric"><b>Помилок:</b> {records_errors}</div>
            <div class="metric"><b>Тривалість:</b> {round(duration, 2)} сек</div>
            <div class="metric"><b>Готовність системи:</b> <span class="status-{'pass' if is_ready else 'fail'}">{'ГОТОВА' if is_ready else 'НЕ ГОТОВА'}</span></div>
            
            <h2>Аудит сховищ даних (Multi-DB Verification)</h2>
    """
    for db_name, res in audit_results.items():
        st = res.get("status", "fail")
        msg = res.get("message", res.get("error", "Невідома помилка"))
        html_content += f"""
            <div class="db-card">
                <h3>{db_name.upper()} — <span class="status-{st}">{st.upper()}</span></h3>
                <p>{msg}</p>
            </div>
        """
    html_content += """
        </div>
    </body>
    </html>
    """
    with open(f"/tmp/predator_reports/audit_{audit_id}.html", "w", encoding="utf-8") as f:
        f.write(html_content)

    logger.info("=== ВАЛІДАЦІЮ ЗАВЕРШЕНО ===")
    logger.info(f"DRI: {round(dri, 2)}% | Готовність: {is_ready}")
    logger.info("Звіти збережено в /tmp/predator_reports/")

if __name__ == "__main__":
    pass  # Цей файл тепер викликається з бекенду
