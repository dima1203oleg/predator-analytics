"""
ProZorro ETL Pipeline — PREDATOR Registry Manager
"""
import logging
from typing import Optional
from app.clients.prozorro_client import ProzorroClient
from app.etl.normalizers.tender_normalizer import TenderNormalizer
from app.services.storage_router import StorageRouter

logger = logging.getLogger(__name__)

class ProzorroPipeline:
    def __init__(self):
        self.client = ProzorroClient()
        self.storage_router = StorageRouter()
        self.normalizer = TenderNormalizer()
        
    async def run_incremental_sync(self, starting_offset: Optional[str] = None, max_items: int = 100):
        """
        Запускає інкрементальне завантаження тендерів (з обмеженням для уникнення OOM).
        """
        logger.info(f"Starting ProZorro incremental sync from offset: {starting_offset}")
        count = 0
        
        try:
            async for raw_tender in self.client.fetch_tenders_incremental(offset=starting_offset):
                if count >= max_items:
                    logger.info(f"Reached max_items limit ({max_items}). Stopping sync.")
                    break
                    
                # 1. Збереження сирих даних (Mocked MinIO)
                await self._store_raw_minio(raw_tender)
                
                # 2. Нормалізація
                normalized_tender = self.normalizer.normalize_prozorro(raw_tender)
                
                # 3. Маршрутизація (БД, Графи, Вектори)
                await self.storage_router.route_data(normalized_tender)
                
                count += 1
                
            logger.info(f"ProZorro sync complete. Processed {count} items.")
        finally:
            await self.client.close()

    async def _store_raw_minio(self, raw_data: dict):
        """Mock збереження в MinIO (WORM)."""
        tender_id = raw_data.get("id")
        # В реальному коді тут буде s3_client.put_object(Bucket="raw-prozorro", Key=f"{tender_id}.json", Body=json.dumps(raw_data))
        logger.debug(f"Stored {tender_id} to MinIO")
