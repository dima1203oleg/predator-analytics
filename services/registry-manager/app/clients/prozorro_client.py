"""
ProZorro API Client — PREDATOR Registry Manager
Автогенерується та підтримується Discovery Engine.
"""
import logging
import httpx
from typing import AsyncGenerator, Any

logger = logging.getLogger(__name__)

class ProzorroClient:
    BASE_URL = "https://public.api.openprocurement.org/api/2.5/tenders"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        logger.info("Initialized ProzorroClient")

    async def fetch_tenders_incremental(self, offset: str = None) -> AsyncGenerator[dict[str, Any], None]:
        """
        Завантажує тендери інкрементально (Incremental REST) за допомогою курсору (offset).
        """
        params = {"offset": offset} if offset else {}
        url = self.BASE_URL

        while True:
            logger.info(f"Fetching ProZorro tenders from {url} with params {params}")
            try:
                response = await self.client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                tenders = data.get("data", [])
                if not tenders:
                    logger.info("No more tenders found.")
                    break
                    
                for tender in tenders:
                    yield tender
                    
                next_page = data.get("next_page", {})
                offset = next_page.get("offset")
                if not offset:
                    break
                params = {"offset": offset}
                
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error occurred: {e}")
                # Тут має бути Retry/Backoff логіка
                break
            except Exception as e:
                logger.error(f"Error fetching data from ProZorro: {e}")
                break

    async def fetch_tender_details(self, tender_id: str) -> dict[str, Any]:
        """Отримує деталі конкретного тендеру."""
        url = f"{self.BASE_URL}/{tender_id}"
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json().get("data", {})

    async def close(self):
        await self.client.aclose()
