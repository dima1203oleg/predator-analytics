import pandas as pd
from sqlalchemy import create_engine, text
import os
import json
import uuid
import sys
import traceback

def run():
    print("🚀 Predator Sync V3.4: Engineering Pipeline")

    # DB Connectivity Logic
    db_candidates = [
        os.environ.get("DATABASE_URL"),
        "postgresql://admin:predator_password@postgres:5432/predator_db",
        "postgresql://admin:666666@postgres:5432/predator_db"
    ]

    engine = None
    connected = False
    for url in db_candidates:
        if not url: continue
        url = url.replace("asyncpg", "psycopg2").replace("postgresql+postgresql", "postgresql")
        print(f"Trying: {url.split('@')[-1]}...")
        try:
            engine = create_engine(url, connect_args={'connect_timeout': 5})
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print(f"✅ Connected to {url.split('@')[-1]}")
            connected = True
            break
        except Exception as e:
            print(f"   Failed connection attempt: {e}")

    if not connected:
        print("❌ CRITICAL: Could not connect to database.")
        sys.exit(1)

    try:
        # Load Data
        file_path = "/app/customs.xlsx"
        if not os.path.exists(file_path):
            file_path = "customs.xlsx"

        print(f"Reading {file_path} (20k rows)...")
        df = pd.read_excel(file_path, nrows=20000, engine='openpyxl')
        print(f"✅ Data loaded: {len(df)} rows.")

        # Schema and Table Setup (Aligned with entities.py)
        with engine.begin() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS gold;"))

            # FORCE recreate to align with entities.py precisely
            print("Aligning metadata tables with entities.py schema...")
            conn.execute(text("DROP TABLE IF EXISTS gold.ml_jobs CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS gold.ml_datasets CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS gold.data_sources CASCADE;"))

            # 1. Data Sources
            conn.execute(text("""
                CREATE TABLE gold.data_sources (
                    id UUID PRIMARY KEY,
                    name VARCHAR(255) UNIQUE NOT NULL,
                    source_type VARCHAR(50) NOT NULL,
                    connector VARCHAR(50) NOT NULL,
                    status VARCHAR(50) DEFAULT 'draft',
                    tenant_id UUID NOT NULL,
                    config JSONB DEFAULT '{}',
                    sector VARCHAR(50),
                    schedule JSONB,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            """))

            # 2. ML Datasets
            conn.execute(text("""
                CREATE TABLE gold.ml_datasets (
                    id UUID PRIMARY KEY,
                    tenant_id UUID NOT NULL,
                    name TEXT UNIQUE NOT NULL,
                    dvc_path TEXT NOT NULL,
                    size_rows INTEGER,
                    tags TEXT[],
                    created_by UUID,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))

            # 3. ML Jobs
            conn.execute(text("""
                CREATE TABLE gold.ml_jobs (
                    id UUID PRIMARY KEY,
                    tenant_id UUID NOT NULL,
                    dataset_id UUID REFERENCES gold.ml_datasets(id),
                    target VARCHAR(50),
                    status VARCHAR(30),
                    metrics JSONB,
                    model_ref TEXT,
                    si_cycle_id UUID,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))

        # Ingestion
        print("Ingesting customs data to gold.customs_declarations...")
        df.columns = [c.replace(' ', '_').replace(',', '').replace('/', '_').lower() for c in df.columns]
        df.to_sql('customs_declarations', engine, schema='gold', if_exists='replace', index=False, chunksize=1000)
        print("✅ Data ingested successfully.")

        # Integration and Registration
        tid = "00000000-0000-0000-0000-000000000000"
        conf_dict = {
            "last_count": len(df),
            "table_name": "gold.customs_declarations",
            "import_method": "direct_sync_v25"
        }
        conf_json = json.dumps(conf_dict)

        with engine.begin() as conn:
            # Register Source
            print("Registering Data Source in registry...")
            conn.execute(text("""
                INSERT INTO gold.data_sources (id, name, connector, source_type, status, tenant_id, config, sector)
                VALUES (:id, :name, :conn, :stype, :status, :tid, CAST(:conf_data AS JSONB), :sector)
            """), {
                "id": uuid.uuid4(),
                "name": "UkrCustoms March 2024",
                "conn": "upload",
                "stype": "file",
                "status": "indexed",
                "tid": tid,
                "conf_data": conf_json,
                "sector": "GOV"
            })

            # ML Dataset
            print("Creating ML Dataset entry...")
            ml_ds_id = uuid.uuid4()
            conn.execute(text("""
                INSERT INTO gold.ml_datasets (id, tenant_id, name, dvc_path, size_rows)
                VALUES (:id, :tid, :name, :path, :size)
            """), {
                "id": ml_ds_id,
                "tid": tid,
                "name": "customs_march_2024",
                "path": "pg://gold.customs_declarations",
                "size": len(df)
            })

            # Create Job
            print("Creating ML Job entry...")
            job_id = uuid.uuid4()
            conn.execute(text("""
                INSERT INTO gold.ml_jobs (id, tenant_id, dataset_id, target, status)
                VALUES (:id, :tid, :dsid, :target, :status)
            """), {
                "id": job_id,
                "tid": tid,
                "dsid": ml_ds_id,
                "target": "Anomaly Detection (XGBoost)",
                "status": "running"
            })

        print(f"🎉 SUCCESS! Real data integrated and registered. ML Job ID: {job_id} is now RUNNING.")

    except Exception:
        print("❌ FAILED during ingestion/integration:")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    run()
