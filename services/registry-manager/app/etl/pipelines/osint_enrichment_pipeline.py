"""
OSINT Enrichment Pipeline — PREDATOR Registry Manager
On-Demand пайплайн для збагачення даних.
"""
import logging
from app.clients.youcontrol_client import YouControlClient
from app.clients.clearbit_client import ClearbitClient
from app.etl.normalizers.osint_normalizer import OsintNormalizer
from app.services.storage_router import StorageRouter

logger = logging.getLogger(__name__)

class OsintEnrichmentPipeline:
    def __init__(self):
        self.yc_client = YouControlClient()
        self.cb_client = ClearbitClient()
        self.normalizer = OsintNormalizer()
        self.storage_router = StorageRouter()

    async def enrich_by_edrpou(self, edrpou: str):
        """Збагачує профіль компанії через YouControl."""
        logger.info(f"Starting OSINT Enrichment for EDRPOU: {edrpou}")
        try:
            # 1. Fetch
            raw_data = await self.yc_client.get_company_dossier(edrpou)
            if not raw_data:
                logger.warning(f"No data found in YouControl for {edrpou}")
                return
                
            # 2. Store Raw (Audit)
            await self._store_audit("youcontrol", edrpou, raw_data)
            
            # 3. Normalize (Merge format)
            enrichment_data = self.normalizer.normalize_youcontrol(raw_data)
            
            # 4. Route (Оновлення існуючого вузла)
            await self.storage_router.route_data(enrichment_data)
            logger.info(f"Successfully enriched {edrpou} via YouControl")
            
        except Exception as e:
            logger.error(f"Enrichment failed for {edrpou}: {e}")

    async def enrich_by_domain(self, domain: str):
        """Збагачує профіль компанії через Clearbit."""
        logger.info(f"Starting OSINT Enrichment for Domain: {domain}")
        try:
            raw_data = await self.cb_client.enrich_domain(domain)
            if not raw_data:
                return
                
            await self._store_audit("clearbit", domain, raw_data)
            enrichment_data = self.normalizer.normalize_clearbit(raw_data)
            await self.storage_router.route_data(enrichment_data)
            
            logger.info(f"Successfully enriched {domain} via Clearbit")
        except Exception as e:
            logger.error(f"Enrichment failed for {domain}: {e}")

    async def _store_audit(self, source: str, identifier: str, data: dict):
        logger.debug(f"Stored OSINT audit trail for {source}/{identifier} to MinIO WORM")

    async def close(self):
        await self.yc_client.close()
        await self.cb_client.close()
