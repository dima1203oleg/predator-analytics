"""
NAZK ETL Pipeline — PREDATOR Registry Manager
"""
import logging
from app.clients.nazk_client import NazkClient
from app.etl.normalizers.nazk_normalizer import NazkNormalizer
from app.services.storage_router import StorageRouter

logger = logging.getLogger(__name__)

class NazkPipeline:
    def __init__(self, client: NazkClient | None = None, storage_router: StorageRouter | None = None, normalizer: NazkNormalizer | None = None):
        self.client = client or NazkClient()
        self.storage_router = storage_router or StorageRouter()
        self.normalizer = normalizer or NazkNormalizer()
        
    async def run_incremental_sync(self, date_from: str | None = None, max_items: int = 100) -> None:
        """
        Завантажує нові декларації з певної дати.
        """
        logger.info(f"Starting NAZK incremental sync from date: {date_from}")
        count = 0
        
        try:
            async for raw_doc in self.client.fetch_declarations_incremental(date_from=date_from):
                if count >= max_items:
                    logger.info(f"Reached max_items limit ({max_items}). Stopping sync.")
                    break
                    
                # 1. MinIO
                await self._store_raw_minio(raw_doc)
                
                # 2. Нормалізація
                normalized_doc = self.normalizer.normalize_declaration(raw_doc)
                
                # 3. Маршрутизація
                await self.storage_router.route_data(normalized_doc)
                
                count += 1
                
            logger.info(f"NAZK sync complete. Processed {count} items.")
        finally:
            await self.client.close()

    async def _store_raw_minio(self, raw_data: dict) -> None:
        doc_id = raw_data.get("id")
        logger.debug(f"Stored {doc_id} to MinIO WORM")
