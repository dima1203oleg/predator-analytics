#!/usr/bin/env python3.12
from __future__ import annotations

import asyncio
import logging
from pathlib import Path
import sys

# ⚜️ ETERNAL RUNTIME GUARD

# Add project root to path so we can import libs
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("etl_test_runner")

async def run_real_etl_test():

    file_path = "/Users/dima-mac/Desktop/Березень_2024.xlsx"

    if not Path(file_path).exists():
        return


    try:
        # Import the real pipeline (Lazy load to ensure paths are set)
        from libs.core.etl_integration import get_etl_pipeline

        pipeline = get_etl_pipeline()

        if not pipeline.parser:
            return


        # Run the pipeline
        result = await pipeline.run_pipeline([file_path])


        if result.success:

            if result.records_transformed > 0:
                pass
            else:
                pass
        else:
            for _err in result.errors:
                pass

    except Exception:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_real_etl_test())
