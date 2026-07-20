"""
OFAC API Client (Bulk Download) — PREDATOR Registry Manager
"""
import logging
import httpx
import hashlib

logger = logging.getLogger(__name__)

class OfacClient:
    # URL для завантаження Consolidated Sanctions List (JSON)
    SDN_URL = "https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.json"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=120.0)
        logger.info("Initialized OfacClient")

    async def download_bulk_dump(self) -> bytes:
        """
        Завантажує весь дамп списку санкцій.
        """
        logger.info(f"Downloading OFAC Bulk Dump from {self.SDN_URL}")
        try:
            response = await self.client.get(self.SDN_URL)
            response.raise_for_status()
            return response.read()
        except Exception as e:
            logger.error(f"Failed to download OFAC list: {e}")
            raise

    def calculate_checksum(self, data: bytes) -> str:
        """Розрахунок SHA-256 хешу файлу."""
        return hashlib.sha256(data).hexdigest()

    async def close(self):
        await self.client.aclose()
