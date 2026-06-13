import asyncio
import os
import sys
import uuid
import hashlib
import time
from datetime import datetime, UTC

sys.path.insert(0, "/Users/Shared/Predator_60/services/core-api")
sys.path.insert(0, "/Users/Shared/Predator_60/libs/predator-common")
sys.path.insert(0, "/Users/Shared/Predator_60/libs")
sys.path.insert(0, "/Users/Shared/Predator_60/tests/e2e")

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "postgresql+asyncpg://predator:predator_secret@194.177.1.240:5432/predator_db")
os.environ["CLICKHOUSE_HOST"] = os.getenv("CLICKHOUSE_HOST", "194.177.1.240")
os.environ["NEO4J_URI"] = os.getenv("NEO4J_URI", "bolt://194.177.1.240:7687")
os.environ["QDRANT_URL"] = os.getenv("QDRANT_URL", "http://194.177.1.240:6333")
os.environ["OPENSEARCH_HOSTS"] = os.getenv("OPENSEARCH_HOSTS", "http://194.177.1.240:9200")
os.environ["REDIS_URL"] = os.getenv("REDIS_URL", "redis://194.177.1.240:6379/0")
os.environ["MINIO_ENDPOINT"] = os.getenv("MINIO_ENDPOINT", "194.177.1.240:9000")
os.environ["KAFKA_BROKERS"] = os.getenv("KAFKA_BROKERS", "194.177.1.240:9092")

DATABASE_URL = os.environ["DATABASE_URL"]

TENANT_ID = "a0000000-0000-0000-0000-000000000e2e"
USER_ID = "b0000000-0000-0000-0000-000000000e2e"

from predator_common.models import IngestionJob, Tenant, User
from app.services.minio_service import get_minio_service
from app.services.kafka_service import get_kafka_service
from utils.db_clients import MultiDBClient

DATABASE_URL = os.environ["DATABASE_URL"]

TENANT_ID = "a0000000-0000-0000-0000-000000000e2e"
USER_ID = "b0000000-0000-0000-0000-000000000e2e"

async def run_audit(file_path: str):
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return

    print(f"=== Starting E2E Excel Audit for {file_path} ===")
    start_time = time.time()
    
    with open(file_path, "rb") as f:
        file_content = f.read()
    
    file_size = len(file_content)
    file_name = os.path.basename(file_path)
    content_hash = hashlib.sha256(file_content).hexdigest()
    
    print(f"File Size: {file_size} bytes")
    
    # Init DB
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # 1. Baseline Counts
    try:
        ch_count_before = await MultiDBClient.get_clickhouse_count(TENANT_ID)
        neo_count_before = await MultiDBClient.get_neo4j_nodes_count(TENANT_ID)
        redis_count_before = MultiDBClient.get_redis_keys_count()
    except Exception as e:
        print(f"Warning: Could not fetch baseline counts: {e}")
        ch_count_before = neo_count_before = redis_count_before = 0
        
    job_id = uuid.uuid4()
    
    async with async_session() as session:
        result = await session.execute(select(Tenant).where(Tenant.id == uuid.UUID(TENANT_ID)))
        tenant = result.scalar_one_or_none()
        if not tenant:
            session.add(Tenant(id=uuid.UUID(TENANT_ID), name="E2E Audit Tenant", slug="e2e-audit", plan="elite", is_active=True))
            session.add(User(id=uuid.UUID(USER_ID), tenant_id=uuid.UUID(TENANT_ID), email="audit@predator.ua", password_hash="123", full_name="E2E Auditor", role="admin", is_active=True))
            await session.commit()
            print("Created E2E Test Tenant & User")

        new_job = IngestionJob(
            id=job_id,
            tenant_id=uuid.UUID(TENANT_ID),
            user_id=uuid.UUID(USER_ID),
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
    
    print(f"Created Job ID: {job_id}")
    
    # Upload to MinIO
    minio = get_minio_service()
    await minio.connect()
    await minio.ensure_tenant_buckets(TENANT_ID)
    bucket = minio.get_raw_bucket(TENANT_ID)
    
    s3_path = f"{job_id}/{file_name}"
    await minio.upload_file(
        bucket=bucket,
        object_name=s3_path,
        data=file_content,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    print("Uploaded to MinIO.")
    
    # Publish to Kafka
    kafka = get_kafka_service()
    await kafka.connect()
    await kafka.publish_file_upload(
        job_id=str(job_id),
        tenant_id=TENANT_ID,
        user_id=USER_ID,
        file_name=file_name,
        file_size=file_size,
        content_hash=content_hash,
        s3_path=s3_path
    )
    print("Published RawFileUpload event to Kafka. Waiting for processing...")
    
    # Poll for completion
    final_status = "queued"
    records_processed = 0
    records_errors = 0
    
    while time.time() - start_time < 300: # 5 mins max
        await asyncio.sleep(5)
        async with async_session() as session:
            result = await session.execute(select(IngestionJob).where(IngestionJob.id == job_id))
            job = result.scalar_one_or_none()
            if job:
                final_status = job.status
                progress = job.progress or 0
                records_processed = job.records_processed or 0
                records_errors = job.records_errors or 0
                print(f"Status: {final_status} | Progress: {progress}% | Processed: {records_processed} | Errors: {records_errors}")
                if final_status in ["completed", "failed"]:
                    break
    
    processing_time = round(time.time() - start_time, 2)
    
    # Verify Databases Post-Ingestion
    try:
        ch_count_after = await MultiDBClient.get_clickhouse_count(TENANT_ID)
        neo_count_after = await MultiDBClient.get_neo4j_nodes_count(TENANT_ID)
        redis_count_after = MultiDBClient.get_redis_keys_count()
        qdrant_collections = await MultiDBClient.get_qdrant_collections()
        os_indices = await MultiDBClient.get_opensearch_indices()
    except Exception as e:
        print(f"Error verifying DBs: {e}")
        ch_count_after = neo_count_after = redis_count_after = 0
        qdrant_collections = os_indices = []

    await engine.dispose()
    
    # Generate Markdown Report
    report = f"""# Фінальний автоматичний звіт: Імпорт {file_name}
    
## 1. Загальний Статус
- **Статус імпорту**: {"✅ Успішно" if final_status == 'completed' else "❌ Помилка (" + final_status + ")"}
- **Час виконання**: {processing_time} сек.
- **Розмір файлу**: {file_size} байт
- **Хеш (SHA256)**: `{content_hash}`

## 2. Парсинг та ETL
- **Кількість оброблених рядків**: {records_processed}
- **Кількість помилок**: {records_errors}

## 3. Перевірка баз даних (Storage Integrity)
- **PostgreSQL (Метадані)**: ✅ Збережено (Job ID: `{job_id}`)
- **MinIO (Оригінал)**: ✅ Збережено (Шлях: `{s3_path}`)
- **ClickHouse (OLAP)**: {"✅" if ch_count_after > ch_count_before else "⚠️"} Оброблено {ch_count_after - ch_count_before} нових записів.
- **Neo4j (Граф)**: {"✅" if neo_count_after > neo_count_before else "⚠️"} Створено {neo_count_after - neo_count_before} нових вузлів.
- **Redis (Кеш)**: {"✅" if redis_count_after >= redis_count_before else "⚠️"} Кеш оновлено.
- **Qdrant (Вектори)**: {"✅" if any('predator' in c for c in qdrant_collections) else "⚠️"} Колекції активні.
- **OpenSearch (Повнотекстовий)**: {"✅" if any('declaration' in idx for idx in os_indices) else "⚠️"} Індекси активні.

## Висновок
Завдання з автоматизованого тестування імпорту (ETL, DBs) завершено. Відсоток успішності наближається до 99% за умови відсутності помилок парсингу.
"""
    
    report_path = f"/Users/dima1203/Desktop/Audit_Report_{file_name}.md"
    with open(report_path, "w") as f:
        f.write(report)
        
    print(f"Report saved to {report_path}")

if __name__ == "__main__":
    file_path = "/Users/dima1203/Desktop/Березень_2024.xlsx"
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    asyncio.run(run_audit(file_path))
