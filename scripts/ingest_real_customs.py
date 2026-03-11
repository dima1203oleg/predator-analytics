"""
🚀 PREDATOR Analytics v55.2 — Канонічний скрипт інгестії реальних митних даних.

Підтримка:
1. Silver Schema (public.declarations, public.companies)
2. Gold Schema (gold.customs_declarations)
3. Multi-tenancy (tenant_id)
4. UPSERT логіка для уникнення дублікатів.
"""
import os
import sys
import uuid
import datetime
import json
import pandas as pd
from sqlalchemy import create_engine, text

# Database connection
DEFAULT_DB_URL = "postgresql://predator:predator_password@localhost:5432/predator_db"
DB_URL = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)
if "postgresql+asyncpg" in DB_URL:
    DB_URL = DB_URL.replace("postgresql+asyncpg", "postgresql")

CSV_FILE = "Березень_2024.csv"
TENANT_ID = "a0000000-0000-0000-0000-000000000001"

def get_engine():
    return create_engine(DB_URL)

def process_declarations_batch(df_batch, tenant_id):
    """Мапування на Silver схему - public.declarations."""
    silver_df = pd.DataFrame()
    
    # 1. basic fields
    silver_df['declaration_number'] = df_batch['Номер митної декларації']
    silver_df['declaration_date'] = pd.to_datetime(df_batch['Дата оформлення'], errors='coerce')
    
    # Direction
    def get_direction(t):
        if str(t).startswith('ІМ'): return 'import'
        if str(t).startswith('ЕК'): return 'export'
        return 'other'
    silver_df['direction'] = df_batch['Тип декларації'].apply(get_direction)
    
    # Importer
    silver_df['importer_edrpou'] = df_batch['ЄДРПОУ одержувача'].fillna('').astype(str).str.zfill(8)
    # UEID format: UA_COMPANY_<EDRPOU>
    silver_df['importer_ueid'] = silver_df['importer_edrpou'].apply(lambda x: f"UA_COMPANY_{x}" if x and x != '00000000' else None)
    silver_df['importer_name'] = df_batch['Одержувач']
    
    # Exporter
    silver_df['exporter_name'] = df_batch['Відправник']
    # If possible, get exporter country from origin or dispatch
    # Note: 'Країна походження' and 'Країна відправлення' exist in CSV
    silver_df['exporter_country'] = df_batch['Країна походження']
    
    # Goods
    silver_df['uktzed_code'] = df_batch['Код товару'].fillna(0).astype(str)
    silver_df['goods_description'] = df_batch['Опис товару']
    
    # Meta
    silver_df['tenant_id'] = tenant_id

    return silver_df

def process_companies_batch(df_batch, tenant_id):
    """Мапування на Silver схему - public.companies."""
    comp_df = pd.DataFrame()
    comp_df['edrpou'] = df_batch['ЄДРПОУ одержувача'].fillna('').astype(str).str.zfill(8)
    comp_df['name'] = df_batch['Одержувач']
    comp_df['ueid'] = comp_df['edrpou'].apply(lambda x: f"UA_COMPANY_{x}" if x and x != '00000000' else None)
    comp_df['tenant_id'] = tenant_id
    comp_df['status'] = 'active'
    
    # Drop records where edrpou is empty or invalid
    comp_df = comp_df[comp_df['ueid'].notnull()].drop_duplicates(subset=['ueid'])
    
    return comp_df

def ingest():
    print(f"🚀 Starting Real CSV Ingestion: {CSV_FILE}")
    
    if not os.path.exists(CSV_FILE):
        print(f"❌ File {CSV_FILE} not found.")
        return

    engine = get_engine()
    
    # Ensure gold schema exists (if not done by init.sql)
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS gold;"))
        conn.commit()

    chunk_size = 5000
    total_processed = 0
    max_rows = 50000 # Limit as requested by history
    
    try:
        iterator = pd.read_csv(CSV_FILE, chunksize=chunk_size, low_memory=False)
        
        for i, df_chunk in enumerate(iterator):
            if total_processed >= max_rows:
                print(f"🛑 Limit {max_rows} reached. Stopping.")
                break
                
            print(f"⏳ Processing chunk {i+1} ({len(df_chunk)} rows)...")

            # 1. Process Companies (Pre-requisite for high quality)
            companies_batch = process_companies_batch(df_chunk, TENANT_ID)
            
            # UPSERT Companies
            with engine.connect() as conn:
                for _, row in companies_batch.iterrows():
                    sql = text("""
                        INSERT INTO companies (name, edrpou, ueid, tenant_id, status)
                        VALUES (:name, :edrpou, :ueid, :tenant_id, :status)
                        ON CONFLICT (ueid) DO NOTHING;
                    """)
                    conn.execute(sql, row.to_dict())
                conn.commit()

            # 2. Process Declarations (Silver)
            declarations_batch = process_declarations_batch(df_chunk, TENANT_ID)
            
            # UPSERT Declarations
            with engine.connect() as conn:
                for _, row in declarations_batch.iterrows():
                    # Handle None values for SQL
                    params = {k: (None if pd.isna(v) else v) for k, v in row.to_dict().items()}
                    
                    sql = text("""
                        INSERT INTO declarations 
                        (declaration_number, declaration_date, direction, importer_ueid, importer_name, importer_edrpou, exporter_name, exporter_country, uktzed_code, goods_description, tenant_id)
                        VALUES (:declaration_number, :declaration_date, :direction, :importer_ueid, :importer_name, :importer_edrpou, :exporter_name, :exporter_country, :uktzed_code, :goods_description, :tenant_id)
                        ON CONFLICT (declaration_number) DO NOTHING;
                    """)
                    conn.execute(sql, params)
                conn.commit()

            # 3. Gold Schema Support (Legacy script path)
            df_chunk.to_sql('customs_declarations', engine, schema='gold', if_exists=('replace' if i==0 else 'append'), index=False)

            total_processed += len(df_chunk)
            print(f"📦 Progress: {total_processed} rows.")

        print("✅ Success! Data ingested into public.declarations, public.companies and gold.customs_declarations.")

        # Updated data_sources registration
        with engine.connect() as conn:
             config_json = json.dumps({"source": CSV_FILE, "type": "Real Customs Import/Export"})
             sql = text("""
                INSERT INTO gold.data_sources (name, connector, source_type, status, tenant_id, config, record_count, updated_at, created_at)
                VALUES ('Real Customs March 2024', 'python_script', 'csv', 'processed', :tenant, :conf, :cnt, NOW(), NOW())
                ON CONFLICT (name) DO UPDATE SET
                    status = 'processed',
                    record_count = :cnt,
                    updated_at = NOW();
            """).bindparams(tenant=TENANT_ID, conf=config_json, cnt=total_processed)
             conn.execute(sql)
             conn.commit()

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    ingest()
