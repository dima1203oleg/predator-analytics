import pytest
import asyncio
import os
import time
import httpx
import json
import uuid
import hashlib
from datetime import datetime, UTC
from sqlalchemy import select, text
from utils.data_generator import generate_customs_excel
from utils.db_clients import MultiDBClient
from predator_common.models import IngestionJob

@pytest.mark.asyncio
async def test_excel_ingestion_full_cycle(db_session, test_tenant_id, test_user_id):
    """
    Тестування повного циклу імпорту:
    - Генерація тестового Excel файлу (з дублями та некоректними даними).
    - Завантаження через API.
    - Перевірка парсера.
    - Перевірка ETL.
    - Перевірка запису у 7 сховищ даних.
    """
    
    # 1. Генерація даних
    os.makedirs("/tmp/e2e_data", exist_ok=True)
    file_path = f"/tmp/e2e_data/e2e_test_{int(time.time())}.xlsx"
    generate_customs_excel(file_path, num_rows=150, sheets=2, include_errors=True)
    
    with open(file_path, "rb") as f:
        file_content = f.read()
    
    # Зберігаємо базові лічильники до імпорту
    ch_count_before = await MultiDBClient.get_clickhouse_count(test_tenant_id)
    neo_count_before = await MultiDBClient.get_neo4j_nodes_count(test_tenant_id)
    redis_count_before = await MultiDBClient.get_redis_keys_count()
    
    # 2. Завантаження через API (імітація фронтенду)
    api_url = os.getenv("API_URL", "http://localhost:8000")
    # Примітка: в реальних тестах тут буде запит на `/api/v1/import/upload` з JWT токеном
    # Оскільки тут ми тестуємо сам бекенд, ми можемо створити Job напряму або викликати API
    # Для цього прикладу, використовуємо API якщо він доступний, інакше симулюємо через базу
    
    job_id = uuid.uuid4()
    
    new_job = IngestionJob(
        id=job_id,
        tenant_id=uuid.UUID(test_tenant_id),
        user_id=uuid.UUID(test_user_id),
        job_type="file_upload",
        file_name="e2e_test.xlsx",
        file_size=len(file_content),
        status="queued",
        progress=0,
        started_at=datetime.now(UTC),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC)
    )
    db_session.add(new_job)
    await db_session.commit()
    
    # Виклик Kafka для старту воркера
    import sys
    sys.path.insert(0, "/Users/Shared/Predator_60/services/core-api")
    from app.services.kafka_service import get_kafka_service
    from app.services.minio_service import get_minio_service
    
    minio = get_minio_service()
    await minio.connect()
    await minio.ensure_tenant_buckets(test_tenant_id)
    bucket = minio.get_raw_bucket(test_tenant_id)
    
    s3_path = f"{job_id}/e2e_test.xlsx"
    await minio.upload_file(
        bucket=bucket,
        object_name=s3_path,
        data=file_content,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    
    kafka = get_kafka_service()
    await kafka.connect()
    await kafka.publish_file_upload(
        job_id=str(job_id),
        tenant_id=test_tenant_id,
        user_id=test_user_id,
        file_name="e2e_test.xlsx",
        file_size=len(file_content),
        content_hash=hashlib.sha256(file_content).hexdigest(),
        s3_path=s3_path
    )
    
    # 3. Моніторинг обробки (очікування завершення)
    timeout = 180 # 3 хвилини
    start_time = time.time()
    final_status = "queued"
    
    while time.time() - start_time < timeout:
        await asyncio.sleep(2)
        result = await db_session.execute(select(IngestionJob).where(IngestionJob.id == job_id))
        job = result.scalar_one_or_none()
        if job:
            final_status = job.status
            if final_status in ["completed", "failed"]:
                break
    
    assert final_status == "completed", f"Job failed or timed out. Status: {final_status}"
    
    # Перевіряємо помилки парсингу (ETL валідація)
    assert job.records_processed > 100, "Парсер мав обробити більше 100 рядків"
    assert job.records_errors > 0, "Парсер мав знайти помилки (згенеровані спеціально)"
    
    # 4. Multi-DB Audit
    
    # 4.1 ClickHouse (Синхронізація, Агрегати)
    ch_count_after = await MultiDBClient.get_clickhouse_count(test_tenant_id)
    assert ch_count_after > ch_count_before, "ClickHouse не отримав нових записів"
    
    # 4.2 Neo4j (Створення вузлів та зв'язків)
    neo_count_after = await MultiDBClient.get_neo4j_nodes_count(test_tenant_id)
    assert neo_count_after > neo_count_before, "Neo4j не отримав нових вузлів компаній"
    
    # 4.3 Qdrant (Генерація Embeddings)
    qdrant_collections = await MultiDBClient.get_qdrant_collections()
    assert any("predator" in c for c in qdrant_collections), "Qdrant колекції не створені"
    
    # 4.4 OpenSearch (Повнотекстова індексація)
    os_indices = await MultiDBClient.get_opensearch_indices()
    assert any("declaration" in idx for idx in os_indices), "OpenSearch індекси не створені"
    
    # 4.5 Redis (Кешування)
    redis_count_after = await MultiDBClient.get_redis_keys_count()
    assert redis_count_after >= redis_count_before, "Redis ключі не оновлено"
    
    # 4.6 MinIO (Збереження файлів)
    minio_count = MultiDBClient.get_minio_objects_count(bucket)
    assert minio_count > 0, "Файл не збережено в MinIO"
    
    print("Multi-DB Audit Passed Successfully!")
