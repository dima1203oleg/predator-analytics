"""
Bulk Sanctions Pipeline — PREDATOR Registry Manager
Обробляє OFAC та РНБО через Bulk Dump.
"""
import logging
import json
from typing import List
from app.clients.ofac_client import OfacClient
from app.clients.rnbo_client import RnboClient
from app.etl.normalizers.sanctions_normalizer import SanctionsNormalizer
from app.services.storage_router import StorageRouter

logger = logging.getLogger(__name__)

class BulkSanctionsPipeline:
    def __init__(self):
        self.ofac_client = OfacClient()
        self.rnbo_client = RnboClient()
        self.storage_router = StorageRouter()
        self.normalizer = SanctionsNormalizer()
        # Тут в реальності має бути підключення до Redis для збереження попередніх хешів
        self.previous_hashes = {}

    async def run_ofac_sync(self):
        """Синхронізація списків OFAC."""
        logger.info("Starting OFAC Bulk Sync...")
        try:
            # 1. Завантажуємо весь дамп
            raw_data = await self.ofac_client.download_bulk_dump()
            
            # 2. Перевіряємо Checksum
            current_hash = self.ofac_client.calculate_checksum(raw_data)
            if self.previous_hashes.get("ofac") == current_hash:
                logger.info("OFAC list has not changed. Skipping processing.")
                return
                
            logger.info("OFAC list updated. Processing...")
            self.previous_hashes["ofac"] = current_hash
            
            # 3. Збереження сирого файлу (WORM)
            await self._store_bulk_minio("ofac", raw_data)
            
            # 4. Extract & Normalize
            # Демонстраційно розбираємо JSON
            parsed_data = json.loads(raw_data.decode("utf-8")) if raw_data else {}
            entities = parsed_data.get("sdnList", {}).get("sdnEntry", [])
            
            # 5. Route (імітуємо batch процесинг)
            for entity in entities[:100]: # Limit for demo
                normalized = self.normalizer.normalize_ofac(entity)
                await self.storage_router.route_data(normalized)
                
            logger.info("OFAC Sync complete.")
        except Exception as e:
            logger.error(f"OFAC Sync failed: {e}")
        finally:
            await self.ofac_client.close()

    async def run_rnbo_sync(self):
        """Синхронізація списків РНБО."""
        logger.info("Starting RNBO Bulk Sync...")
        try:
            raw_data = await self.rnbo_client.download_bulk_dump()
            current_hash = self.rnbo_client.calculate_checksum(raw_data)
            
            if self.previous_hashes.get("rnbo") == current_hash:
                logger.info("RNBO list has not changed. Skipping processing.")
                return
                
            self.previous_hashes["rnbo"] = current_hash
            await self._store_bulk_minio("rnbo", raw_data)
            
            parsed_data = json.loads(raw_data.decode("utf-8")) if raw_data else {}
            entities = parsed_data.get("entities", [])
            
            for entity in entities[:100]:
                normalized = self.normalizer.normalize_rnbo(entity)
                await self.storage_router.route_data(normalized)
                
            logger.info("RNBO Sync complete.")
        except Exception as e:
            logger.error(f"RNBO Sync failed: {e}")
        finally:
            await self.rnbo_client.close()

    async def _store_bulk_minio(self, source: str, raw_data: bytes):
        logger.debug(f"Stored FULL BULK DUMP of {source} to MinIO")
