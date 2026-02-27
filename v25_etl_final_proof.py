from __future__ import annotations

import asyncio
import os
from pathlib import Path
import sys
from unittest.mock import AsyncMock


# Add core paths
ROOT_DIR = Path("/Users/dima-mac/Documents/Predator_21")
sys.path.append(str(ROOT_DIR))
sys.path.append(str(ROOT_DIR / "apps" / "backend"))

async def run_diagnostic():
    print("🧠 Predator Analytics v45.0 Final E2E Logic Proof")
    print("---------------------------------------------------")

    from app.services.etl_ingestion import ETLIngestionService

    file_path = str(ROOT_DIR / "custom_declarations_registry.xlsx")
    if not os.path.exists(file_path):
        print(f"❌ Error: {file_path} not found")
        return

    # Mock the DB load to avoid failing on Docker connection
    # We also mock _read_file to ensure we use openpyxl
    etl = ETLIngestionService()
    etl._load_to_postgres = AsyncMock(return_value=1000)

    print("✅ Service ready. Running full process_file logic...")

    try:
        # This will run renaming, sanitization, validation, and transformation
        result = await etl.process_file(file_path, "customs")

        if result["status"] == "success":
            print("🚀 SUCCESS: ETL Pipeline validated for v45.0 test data.")
            print(f"📊 Records processed: {result['record_count']}")
            print(f"📝 Table name: {result['table_name']}")
            print(f"🔍 Sample clean record: {result['documents'][0] if result['documents'] else 'None'}")

            # Check if HS Code was correctly mapped and sanitized
            first_doc = result['documents'][0]
            if "hs_code" in first_doc:
                print(f"✅ Mapping check: 'hs_code' present ({first_doc['hs_code']})")
            else:
                print(f"❌ Mapping check: 'hs_code' MISSING. Available keys: {list(first_doc.keys())}")

            if "country" in first_doc:
                print(f"✅ Fallback check: 'country' present ({first_doc['country']})")
        else:
            print(f"❌ ETL Logic Failure: {result.get('error')}")

    except Exception as e:
        print(f"❌ Critical Error during diagnostic: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_diagnostic())
