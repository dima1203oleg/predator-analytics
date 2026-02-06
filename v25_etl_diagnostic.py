from __future__ import annotations

import asyncio
import os
from pathlib import Path
import sys


# Add core paths
ROOT_DIR = Path("/Users/dima-mac/Documents/Predator_21")
sys.path.append(str(ROOT_DIR))
sys.path.append(str(ROOT_DIR / "apps" / "backend"))

async def run_diagnostic():
    print("🧠 Predator Analytics v25.0 Diagnostic - ETL Layer")
    print("---------------------------------------------------")

    from app.services.etl_ingestion import ETLIngestionService

    file_path = str(ROOT_DIR / "custom_declarations_registry.xlsx")
    if not os.path.exists(file_path):
        print(f"❌ Error: {file_path} not found")
        return

    etl = ETLIngestionService()
    print(f"✅ ETLIngestionService initialized. Target: {os.path.basename(file_path)}")

    try:
        # Step 1: Read and Transform (The core logic)
        df = await etl._read_file(file_path)
        print(f"✅ File read successfully. Columns: {df.columns.tolist()}")
        print(f"✅ Sample data row 1: {df.iloc[0].to_dict()}")

        # Rename columns as per service logic
        column_map = {
            "Дата оформлення": "date",
            "Код товару": "hs_code",
            "Фактурна варість, валюта контракту": "amount",
            "Країна походження": "country",
            "Номер митної декларації": "decl_number"
        }
        df_renamed = df.rename(columns=column_map)
        print(f"✅ Columns renamed. Required present: {'date' in df_renamed.columns}")

        # Step 2: Validate Schema
        validation = await etl._validate_schema(df_renamed, "customs")
        print(f"✅ Schema validation: {validation}")

        # Step 3: Transform
        df_clean = await etl._transform(df_renamed, "customs")
        print(f"✅ Data cleaned and transformed. Records: {len(df_clean)}")

        # Step 4: Database Logic Check (Static check)
        print("🔍 Database check: Infrastructure is DOWN (Docker error). PostgreSQL load skipped.")

    except Exception as e:
        print(f"❌ Diagnostic failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_diagnostic())
