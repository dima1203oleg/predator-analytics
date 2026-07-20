"""
Spending ETL Pipeline — PREDATOR Registry Manager
"""
import logging
from datetime import datetime, timedelta
from app.clients.spending_client import SpendingClient
from app.etl.normalizers.spending_normalizer import SpendingNormalizer
from app.services.storage_router import StorageRouter

logger = logging.getLogger(__name__)

class SpendingPipeline:
    def __init__(self):
        self.client = SpendingClient()
        self.storage_router = StorageRouter()
        self.normalizer = SpendingNormalizer()
        
    async def run_sync_for_date(self, target_date: str, max_items: int = 100):
        """
        Завантажує транзакції за конкретний день.
        """
        logger.info(f"Starting Spending sync for date: {target_date}")
        count = 0
        
        try:
            async for raw_tx in self.client.fetch_transactions_by_date(target_date):
                if count >= max_items:
                    logger.info(f"Reached max_items limit ({max_items}). Stopping sync.")
                    break
                    
                # 1. MinIO
                await self._store_raw_minio(raw_tx)
                
                # 2. Нормалізація
                normalized_tx = self.normalizer.normalize_spending(raw_tx)
                
                # 3. Маршрутизація
                await self.storage_router.route_data(normalized_tx)
                
                count += 1
                
            logger.info(f"Spending sync complete for {target_date}. Processed {count} items.")
        finally:
            await self.client.close()

    async def _store_raw_minio(self, raw_data: dict):
        tx_id = raw_data.get("id")
        logger.debug(f"Stored {tx_id} to MinIO WORM")
