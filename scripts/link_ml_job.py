from __future__ import annotations

import os
import time
import uuid

from sqlalchemy import create_engine, text

# Config
DEFAULT_DB_URL = "postgresql://admin:666666@localhost:5432/predator_db"
DB_URL = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)

if "postgresql+asyncpg" in DB_URL:
    DB_URL = DB_URL.replace("postgresql+asyncpg", "postgresql")

def link_job():
    tenant_id = "00000000-0000-0000-0000-000000000000"

    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Ensure tables exist
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS gold.ml_datasets (
                    id UUID PRIMARY KEY,
                    name TEXT NOT NULL,
                    dvc_path TEXT NOT NULL,
                    tenant_id UUID NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS gold.ml_jobs (
                    id UUID PRIMARY KEY,
                    name TEXT,
                    type TEXT,
                    status TEXT,
                    dataset_id UUID REFERENCES gold.ml_datasets(id),
                    tenant_id UUID NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()

            # 1. Get Datasource ID
            res = None
            for _ in range(10):
                res = conn.execute(text("SELECT id FROM gold.data_sources WHERE name='UkrCustoms March 2024'")).fetchone()
                if res:
                    break
                time.sleep(2)

            if not res:
                return

            res[0]

            # 2. Create MLDataset entry
            check = conn.execute(text("SELECT id FROM gold.ml_datasets WHERE name='customs_march_2024'")).fetchone()
            if check:
                ml_ds_id = check[0]
            else:
                ml_ds_id = uuid.uuid4()
                conn.execute(text("""
                    INSERT INTO gold.ml_datasets (id, name, dvc_path, tenant_id, created_at)
                    VALUES (:id, 'customs_march_2024', 'pg://gold.customs_declarations', :tenant_id, NOW())
                """), {"id": ml_ds_id, "tenant_id": tenant_id})
                conn.commit()


            # 3. Create active Job
            job_id = uuid.uuid4()
            conn.execute(text("""
                INSERT INTO gold.ml_jobs (id, name, type, status, dataset_id, tenant_id, created_at)
                VALUES (:id, 'Anomaly Detection (XGBoost)', 'training', 'running', :ds_id, :tenant_id, NOW())
            """), {"id": job_id, "ds_id": ml_ds_id, "tenant_id": tenant_id})
            conn.commit()

    except Exception:
        pass

if __name__ == "__main__":
    link_job()
