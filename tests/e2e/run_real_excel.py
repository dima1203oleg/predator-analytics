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

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from predator_common.models import IngestionJob, Tenant, User
from app.services.minio_service import get_minio_service
from app.services.kafka_service import get_kafka_service
from utils.db_clients import MultiDBClient

os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "postgresql+asyncpg://predator:predator_secret@194.177.1.240:5432/predator_db")
os.environ["CLICKHOUSE_HOST"] = os.getenv("CLICKHOUSE_HOST", "194.177.1.240")
os.environ["NEO4J_URI"] = os.getenv("NEO4J_URI", "http://194.177.1.240:7474")
os.environ["QDRANT_URL"] = os.getenv("QDRANT_URL", "http://194.177.1.240:6333")
os.environ["OPENSEARCH_HOSTS"] = os.getenv("OPENSEARCH_HOSTS", "http://194.177.1.240:9200")
os.environ["REDIS_URL"] = os.getenv("REDIS_URL", "redis://194.177.1.240:6379/0")
os.environ["MINIO_ENDPOINT"] = os.getenv("MINIO_ENDPOINT", "194.177.1.240:9000")
os.environ["KAFKA_BROKERS"] = os.getenv("KAFKA_BROKERS", "194.177.1.240:9092")

DATABASE_URL = os.environ["DATABASE_URL"]

TENANT_ID = "a0000000-0000-0000-0000-000000000e2e"
USER_ID = "b0000000-0000-0000-0000-000000000e2e"

async def run_real_excel(file_path: str):
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return

    print(f"--- Starting E2E test for {file_path} ---")
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
    except Exception:
        ch_count_before = 0
    print(f"Clickhouse base count: {ch_count_before}")
        
    job_id = uuid.uuid4()
    
    async with async_session() as session:
        # Check tenant exists
        result = await session.execute(select(Tenant).where(Tenant.id == uuid.UUID(TENANT_ID)))
        tenant = result.scalar_one_or_none()
        if not tenant:
            session.add(Tenant(id=uuid.UUID(TENANT_ID), name="E2E Tenant", slug="e2e", plan="elite", is_active=True))
            session.add(User(id=uuid.UUID(USER_ID), tenant_id=uuid.UUID(TENANT_ID), email="e2e@predator.ua", password_hash="123", full_name="E2E", role="admin", is_active=True))
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
    
    print(f"Created Job: {job_id}")
    
    # 2. Upload MinIO
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
    
    # 3. Publish to Kafka
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
    print("Published RawFileUpload event to Kafka.")
    
    # 4. Wait
    print("Waiting for ingestion-worker to process... (Polling DB)")
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
    
    print(f"Final Job Status: {final_status}")
    print(f"Processed: {records_processed}, Errors: {records_errors}")
    
    try:
        ch_count_after = await MultiDBClient.get_clickhouse_count(TENANT_ID)
        print(f"Clickhouse final count: {ch_count_after} (Diff: +{ch_count_after - ch_count_before})")
    except Exception as e:
        print(f"Failed to verify clickhouse: {e}")

    await engine.dispose()
    
    print("Test finished.")

if __name__ == "__main__":
    file_path = "/Users/dima1203/Desktop/Березень_2024.xlsx"
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    asyncio.run(run_real_excel(file_path))
