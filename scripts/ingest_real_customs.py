"""🚀 PREDATOR Analytics v56.0 — Канонічний скрипт інгестії реальних митних даних.

Підтримка:
1. Silver Schema (public.declarations, public.companies)
2. Gold Schema (gold.customs_declarations)
3. Multi-tenancy (tenant_id)
4. UPSERT логіка для уникнення дублікатів.
5. Автоматичне завантаження .env.
"""
import json
import logging
import os

from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import create_engine, text

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("ingestion")

# Завантажуємо змінні оточення
load_dotenv()

# Database connection
DEFAULT_DB_URL = "postgresql://admin:predator_password@localhost:5432/predator_db"
DB_URL = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)

# Для підтримки SQLAlchemy sync engine, якщо URL має asyncpg
if "postgresql+asyncpg" in DB_URL:
    DB_URL = DB_URL.replace("postgresql+asyncpg", "postgresql")

CSV_FILE = os.environ.get("CUSTOMS_CSV_PATH", "/Users/dima-mac/Documents/Predator_21/Березень_2024.csv")
TENANT_ID = os.environ.get("TENANT_ID", "a0000000-0000-0000-0000-000000000001")

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
    # Використовуємо 'Країна відправлення' для експортера, а 'Країна походження' для товару
    silver_df['exporter_country'] = df_batch['Країна відправлення'].fillna(df_batch['Країна походження'])

    # Goods
    silver_df['uktzed_code'] = df_batch['Код товару'].fillna(0).astype(str).str.replace('.0', '', regex=False)
    silver_df['goods_description'] = df_batch['Опис товару']

    # Weights and Value
    silver_df['net_weight_kg'] = pd.to_numeric(df_batch['Маса, нетто, кг'].replace('#N/A', 0), errors='coerce').fillna(0)
    silver_df['gross_weight_kg'] = pd.to_numeric(df_batch['Маса, брутто, кг'].replace('#N/A', 0), errors='coerce').fillna(0)

    # Calculate Customs Value: Price per kg * Net Weight
    price_per_kg = pd.to_numeric(df_batch['Розрахункова митна вартість, нетто дол. США / кг'].replace('#N/A', 0), errors='coerce').fillna(0)
    silver_df['customs_value_usd'] = price_per_kg * silver_df['net_weight_kg']

    silver_df['country_origin'] = df_batch['Країна походження']

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
    logger.info(f"🚀 Запуск інгестії реальних CSV даних: {CSV_FILE}")

    if not os.path.exists(CSV_FILE):
        logger.error(f"❌ Файл {CSV_FILE} не знайдено.")
        return

    engine = get_engine()

    # Ensure gold schema exists (if not done by init.sql)
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS gold;"))
        # Set tenant for RLS
        conn.execute(text(f"SET app.current_tenant = '{TENANT_ID}';"))
        conn.execute(text("SET search_path TO public, gold;"))
        conn.commit()

    chunk_size = 5000
    total_processed = 0
    max_rows = 50000 # Limit as requested by history

    try:
        iterator = pd.read_csv(CSV_FILE, chunksize=chunk_size, low_memory=False)

        for i, df_chunk in enumerate(iterator):
            if total_processed >= max_rows:
                logger.warning(f"🛑 Ліміт {max_rows} досягнуто. Зупинка.")
                break

            logger.info(f"⏳ Обробка чанку {i+1} ({len(df_chunk)} рядків)...")

            # 1. Process Companies
            # Прибираємо ітерацію df.iterrows() і робимо Bulk Insert
            comp_df = process_companies_batch(df_chunk, TENANT_ID)

            with engine.begin() as conn: # engine.begin() автоматично робить COMMIT або ROLLBACK
                conn.execute(text(f"SET app.current_tenant = '{TENANT_ID}';"))
                if not comp_df.empty:
                    # Конвертуємо DataFrame у список словників з обробкою NaN -> None
                    comp_records = [{k: (None if pd.isna(v) else v) for k, v in record.items()} for record in comp_df.to_dict('records')]

                    sql_companies = text("""
                        INSERT INTO companies (name, edrpou, ueid, tenant_id, status)
                        VALUES (:name, :edrpou, :ueid, :tenant_id, :status)
                        ON CONFLICT (ueid) DO UPDATE SET
                            name = EXCLUDED.name,
                            updated_at = NOW();
                    """)
                    # Масове виконання (Bulk Execute) - в рази швидше
                    conn.execute(sql_companies, comp_records)

            # 2. Process Declarations (Silver)
            declarations_df = process_declarations_batch(df_chunk, TENANT_ID)

            with engine.begin() as conn:
                conn.execute(text(f"SET app.current_tenant = '{TENANT_ID}';"))
                if not declarations_df.empty:
                    # Аналогічно, конвертуємо в список словників
                    decl_records = [{k: (None if pd.isna(v) else v) for k, v in record.items()} for record in declarations_df.to_dict('records')]

                    sql_declarations = text("""
                        INSERT INTO declarations
                        (declaration_number, declaration_date, direction, importer_ueid, importer_name, importer_edrpou, exporter_name, exporter_country, uktzed_code, goods_description, net_weight_kg, gross_weight_kg, customs_value_usd, country_origin, tenant_id)
                        VALUES (:declaration_number, :declaration_date, :direction, :importer_ueid, :importer_name, :importer_edrpou, :exporter_name, :exporter_country, :uktzed_code, :goods_description, :net_weight_kg, :gross_weight_kg, :customs_value_usd, :country_origin, :tenant_id)
                        ON CONFLICT (declaration_number) DO NOTHING;
                    """)
                    conn.execute(sql_declarations, decl_records)

            # 3. Gold Schema Support (Legacy script path)
            df_chunk.to_sql('customs_declarations', engine, schema='gold', if_exists=('replace' if i==0 else 'append'), index=False)

            total_processed += len(df_chunk)
            logger.info(f"📦 Прогрес: {total_processed} рядків.")

        logger.info("✅ Успіх! Дані завантажені в public.declarations, public.companies та gold.customs_declarations.")

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

    except Exception:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    ingest()
