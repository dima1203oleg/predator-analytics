import asyncio
import logging
import sys
import os

# Add the registry-manager app directory to PYTHONPATH
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.etl.pipelines.prozorro_pipeline import ProzorroPipeline
from app.etl.pipelines.spending_pipeline import SpendingPipeline
from app.etl.pipelines.nazk_pipeline import NazkPipeline
from app.etl.pipelines.bulk_sanctions_pipeline import BulkSanctionsPipeline

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("IntegrationTest")

async def test_pipelines():
    logger.info("=== Starting Integration Test for ETL Pipelines ===")
    
    # 1. ProZorro Pipeline
    logger.info("--- Testing ProZorro Pipeline ---")
    prozorro = ProzorroPipeline()
    # We will fetch only 1 item for dry-run
    await prozorro.run_incremental_sync(max_items=1)
    
    # 2. Spending Pipeline
    logger.info("--- Testing Spending Pipeline ---")
    spending = SpendingPipeline()
    await spending.run_sync_for_date("2023-10-01", max_items=1)
    
    # 3. NAZK Pipeline
    logger.info("--- Testing NAZK Pipeline ---")
    nazk = NazkPipeline()
    await nazk.run_incremental_sync(max_items=1)
    
    # 4. OFAC/RNBO Pipeline
    logger.info("--- Testing Bulk Sanctions Pipeline ---")
    sanctions = BulkSanctionsPipeline()
    # Since bulk sanctions processes 100 items by default, we can just run it
    # We may want to mock the client slightly to not download huge files if we just want a fast test
    # But since it's a test, we will see if it runs
    logger.info("Skipping actual bulk download for quick test, just verifying imports and setup")
    
    logger.info("=== Integration Test Complete ===")

if __name__ == "__main__":
    asyncio.run(test_pipelines())
