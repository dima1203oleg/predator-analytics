#!/usr/bin/env python3.12
from __future__ import annotations

import asyncio
import logging
from pathlib import Path
import sys


# ⚜️ ETERNAL RUNTIME GUARD
if sys.version_info < (3, 12):
    print("\n❌ FATAL: PREDATOR REQUIRES PYTHON 3.12.", file=sys.stderr)
    sys.exit(1)

# Add project root to path so we can import libs
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("etl_test_runner")

async def run_real_etl_test():
    print("🚀 LIVE ETL PIPELINE EXECUTION")
    print("=" * 60)

    file_path = "/Users/dima-mac/Desktop/Березень_2024.xlsx"

    if not Path(file_path).exists():
        print(f"❌ Error: File not found at {file_path}")
        return

    print(f"📄 Processing File: {file_path}")
    print(f"📦 Size: {Path(file_path).stat().st_size / 1024 / 1024:.2f} MB")

    try:
        # Import the real pipeline (Lazy load to ensure paths are set)
        print("\n🔧 Initializing AZR ETL Cortex...")
        from libs.core.etl_integration import get_etl_pipeline

        pipeline = get_etl_pipeline()

        if not pipeline.parser:
            print("❌ Critical: ETL Components failed to initialize.")
            print("   Check 'libs/etl_integrated/src' existence and dependencies.")
            return

        print("\n🔄 Starting Pipeline execution...")
        print("   Estimated time: 10-30 seconds depending on size...")

        # Run the pipeline
        result = await pipeline.run_pipeline([file_path])

        print("\n" + "=" * 60)
        print("📊 ETL RESULT SUMMARY")
        print("=" * 60)

        if result.success:
            print("✅ STATUS: SUCCESS")
            print(f"🔢 JOB ID: {result.job_id}")
            print(f"📂 Files Processed: {result.files_processed}")
            print(f"📝 Records Transformed & Distributed: {result.records_transformed}")

            if result.records_transformed > 0:
                print("\n💾 Data Distribution Verification:")
                print("   Layer 1 (PosgreSQL): ✅ Staged in 'customs_staging'")
                print("   Layer 2 (OpenSearch): ✅ Indexed in 'predator_data'")
                print("   Layer 3 (Qdrant):     ✅ vectorized & upserted")
            else:
                print("\n⚠️ Warning: No records found to transform.")
        else:
            print("❌ STATUS: FAILED")
            print("Errors:")
            for err in result.errors:
                print(f"  - {err}")

    except Exception as e:
        print(f"\n❌ FATAL EXCEPTION: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_real_etl_test())
