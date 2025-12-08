import pandas as pd
import sqlalchemy
from sqlalchemy import create_engine, text
import os
from datetime import datetime

# Config
DB_USER = "predator"
DB_PASS = "predator_password"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "predator_db"

FILE_PATH = "/Users/dima-mac/Downloads/Березень_2024.xlsx"
TABLE_NAME = "ua_customs_imports"

def run_ingestion():
    print(f"🚀 Starting REAL ingestion pipeline for {TABLE_NAME}")
    
    # 1. Connect to Postgres
    db_url = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            print("✅ Connected to PostgreSQL")
            
            # 2. Read Excel (Chunked/Limited for Demo)
            print(f"📂 Reading Excel: {FILE_PATH} (Limit: 1000 rows for speed)")
            df = pd.read_excel(FILE_PATH, nrows=1000, engine='openpyxl')
            
            # Normalize column names (replace spaces with _, lower)
            df.columns = [c.strip().replace(" ", "_").replace(",", "").replace(".", "").replace("/", "_").lower()[:60] for c in df.columns]
            
            # Add metadata columns
            df['ingested_at'] = datetime.now()
            df['source_file'] = os.path.basename(FILE_PATH)
            
            print(f"📊 Prepare to insert {len(df)} rows with {len(df.columns)} columns")
            
            # 3. Create Table / Insert
            # if_exists='replace' just for this clean demo, normally 'append'
            df.to_sql(TABLE_NAME, engine, if_exists='replace', index=False)
            
            print(f"✅ Successfully wrote {len(df)} records to table '{TABLE_NAME}'")
            
            # Verify count
            result = conn.execute(text(f"SELECT count(*) FROM {TABLE_NAME}"))
            count = result.scalar()
            print(f"🔎 Verification: Table now has {count} rows.")

    except Exception as e:
        print(f"❌ Ingestion Failed: {e}")

if __name__ == "__main__":
    run_ingestion()
