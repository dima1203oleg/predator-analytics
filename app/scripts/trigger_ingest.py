from __future__ import annotations

import asyncio
import os
from pathlib import Path
import sys

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT_DIR))

# Mock environment if needed
os.environ["ENVIRONMENT"] = "production"


async def main():
    try:
        from app.services.etl_ingestion import ETLIngestionService

        service = ETLIngestionService()

        file_path = "/app/uploads/Березень_2024.xlsx"
        if not os.path.exists(file_path):
            return

        await service.process_file(file_path, dataset_type="customs")
    except Exception:
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
