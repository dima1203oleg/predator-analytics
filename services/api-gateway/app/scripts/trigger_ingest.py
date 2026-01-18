import asyncio
import os
import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT_DIR))

# Mock environment if needed
os.environ["ENVIRONMENT"] = "production"

async def main():
    try:
        from app.services.etl_ingestion import ETLIngestionService
        service = ETLIngestionService()

        file_path = "/app/March_2024_Registry.xlsx"
        if not os.path.exists(file_path):
            print(f"Error: File {file_path} not found.")
            return

        print(f"Starting ingestion for {file_path}...")
        result = await service.process_file(file_path, dataset_type="customs")
        print(f"Ingestion result: {result}")
    except Exception as e:
        print(f"Failed to trigger ingestion: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
