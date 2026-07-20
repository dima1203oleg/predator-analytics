"""
Special Pipelines (Cyber, Interpol, Blockchain) — PREDATOR Registry Manager
"""
import logging
from app.clients.interpol_client import InterpolClient
from app.clients.blockchain_client import BlockchainClient
from app.clients.cyber_client import CyberClient
from app.etl.normalizers.special_normalizer import SpecialNormalizer
from app.services.storage_router import StorageRouter

logger = logging.getLogger(__name__)

class SpecialPipelines:
    def __init__(self):
        self.interpol_client = InterpolClient()
        self.blockchain_client = BlockchainClient()
        self.cyber_client = CyberClient()
        self.normalizer = SpecialNormalizer()
        self.storage_router = StorageRouter()

    async def run_interpol_sync(self, max_items: int = 100):
        """Інкрементальна синхронізація Interpol Red Notices."""
        logger.info("Starting Interpol Sync...")
        count = 0
        try:
            async for raw_notice in self.interpol_client.fetch_notices():
                if count >= max_items:
                    break
                await self._store_raw("interpol", raw_notice)
                normalized = self.normalizer.normalize_interpol(raw_notice)
                await self.storage_router.route_data(normalized)
                count += 1
            logger.info(f"Interpol Sync complete. Processed {count} items.")
        except Exception as e:
            logger.error(f"Interpol Sync failed: {e}")
        finally:
            await self.interpol_client.close()

    async def enrich_crypto_wallet(self, address: str):
        """On-Demand перевірка гаманця."""
        logger.info(f"Starting Blockchain Enrichment for {address}")
        try:
            raw_data = await self.blockchain_client.check_wallet(address)
            if not raw_data:
                return
            await self._store_raw("blockchain", raw_data)
            normalized = self.normalizer.normalize_blockchain(raw_data)
            await self.storage_router.route_data(normalized)
        except Exception as e:
            logger.error(f"Blockchain Enrichment failed: {e}")
        finally:
            await self.blockchain_client.close()

    async def enrich_email(self, email: str):
        """On-Demand перевірка Email на витоки."""
        logger.info(f"Starting Cyber Enrichment for {email}")
        try:
            raw_data = await self.cyber_client.search_email(email)
            if not raw_data:
                return
            await self._store_raw("cyber", raw_data)
            normalized = self.normalizer.normalize_cyber_leak(raw_data)
            await self.storage_router.route_data(normalized)
        except Exception as e:
            logger.error(f"Cyber Enrichment failed: {e}")
        finally:
            await self.cyber_client.close()

    async def _store_raw(self, source: str, data: dict):
        logger.debug(f"Stored {source} data to MinIO WORM")
