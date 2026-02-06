from __future__ import annotations

import datetime
import json
import os
import sys
import uuid

import pandas as pd
from sqlalchemy import create_engine, text


# Config
DEFAULT_DB_URL = "postgresql://admin:666666@localhost:5432/predator_db"
DB_URL = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)

if "postgresql+asyncpg" in DB_URL:
    DB_URL = DB_URL.replace("postgresql+asyncpg", "postgresql")

# Local path inside container
FILE_PATH = "customs.xlsx"

def ingest():
    global FILE_PATH
    print("🚀 Starting Real Data Ingestion")

    if not os.path.exists(FILE_PATH):
        if os.path.exists("/Users/dima-mac/Desktop/Березень_2024.xlsx"):
             FILE_PATH = "/Users/dima-mac/Desktop/Березень_2024.xlsx"
        else:
             print(f"❌ File not found: {FILE_PATH}")
             return

    # 1. Read Excel
    print("⏳ Reading Excel file...")
    try:
        df = pd.read_excel(FILE_PATH, nrows=20000)
        print(f"✅ Loaded {len(df)} rows")
    except Exception as e:
        print(f"❌ Failed to read Excel: {e}")
        return

    # 2. Rename columns
    column_map = {
        'Митниця оформлення': 'customs_office',
        'Тип декларації': 'declaration_type',
        'Номер митної декларації': 'declaration_number',
        'Дата оформлення': 'date',
        'Відправник': 'sender_name',
        'ЄДРПОУ одержувача': 'recipient_code',
        'Одержувач': 'recipient_name',
        'Код товару': 'product_code',
        'Опис товару': 'product_description',
        'Торгуюча країна': 'trading_country',
        'Країна відправлення': 'departure_country',
        'Країна походження': 'origin_country',
        'Маса, нетто, кг': 'net_weight_kg',
        'Фактурна варість, валюта контракту': 'invoice_value'
    }

    valid_cols = [c for c in column_map if c in df.columns]
    df_clean = df[valid_cols].copy()
    df_clean.rename(columns=column_map, inplace=True)
    df_clean['ingested_at'] = datetime.datetime.now()

    if 'recipient_code' in df_clean.columns:
        df_clean['recipient_code'] = df_clean['recipient_code'].fillna('').astype(str)

    # 3. Connect to DB
    print("🔌 Connecting to Database...")
    try:
        engine = create_engine(DB_URL)

        with engine.connect() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS gold;"))
            conn.commit()

            # Ensure table exists
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS gold.data_sources (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) UNIQUE,
                    source_type VARCHAR(50),
                    connector VARCHAR(50),
                    status VARCHAR(50),
                    tenant_id UUID NOT NULL,
                    config JSONB,
                    record_count INT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()

        print("⏳ Writing records to 'gold.customs_declarations'...")
        df_clean.to_sql(
            'customs_declarations',
            engine,
            schema='gold',
            if_exists='replace',
            index=False,
            chunksize=1000
        )

        # 5. Register in Data Sources
        config_obj = {"last_count": len(df_clean), "table_name": "gold.customs_declarations"}
        config_json = json.dumps(config_obj)
        tenant_id = "00000000-0000-0000-0000-000000000000"

        with engine.connect() as conn:
            # Use bindparams explicitly to avoid mapping errors
            sql = text("""
                INSERT INTO gold.data_sources (name, connector, source_type, status, tenant_id, config, record_count, updated_at, created_at)
                VALUES ('UkrCustoms March 2024', 'upload', 'file', 'indexed', :tenant, :conf, :cnt, NOW(), NOW())
                ON CONFLICT (name) DO UPDATE SET
                    status = 'indexed',
                    config = :conf,
                    record_count = :cnt,
                    updated_at = NOW();
            """).bindparams(tenant=tenant_id, conf=config_json, cnt=len(df_clean))

            conn.execute(sql)
            conn.commit()

        print("✅ Ingestion Complete!")

    except Exception as e:
        print(f"❌ Database Error: {e}")

if __name__ == "__main__":
    ingest()
