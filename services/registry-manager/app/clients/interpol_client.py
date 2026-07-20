"""
Interpol API Client — PREDATOR Registry Manager
"""
import logging
import httpx
from typing import AsyncGenerator, Any

logger = logging.getLogger(__name__)

class InterpolClient:
    # Public Interpol Red Notices API
    BASE_URL = "https://ws-public.interpol.int/notices/v1/red"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=45.0)
        logger.info("Initialized InterpolClient")

    async def fetch_notices(self) -> AsyncGenerator[dict[str, Any], None]:
        """Отримує список червоних карток (Red Notices)."""
        logger.info(f"Fetching Interpol Red Notices")
        url = self.BASE_URL
        page = 1
        
        try:
            while True:
                response = await self.client.get(url, params={"page": page, "resultPerPage": 20})
                response.raise_for_status()
                data = response.json()
                
                notices = data.get("_embedded", {}).get("notices", [])
                if not notices:
                    break
                    
                for notice in notices:
                    yield notice
                    
                # Interpol has a limit of 160 results (8 pages) for public API search without filters
                if page >= 8:
                    break
                page += 1
                
        except Exception as e:
            logger.error(f"Error fetching data from Interpol: {e}")

    async def close(self):
        await self.client.aclose()
