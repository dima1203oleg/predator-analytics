import logging
from typing import Any

import httpx

logger = logging.getLogger("core-api.osint.prozorro")

class ProzorroCollector:
    """Асинхронний колектор даних Prozorro (api.prozorro.gov.ua).
    """

    BASE_URL = "https://public.api.openprocurement.org/api/2.5"

    async def fetch_tenders(self, offset: str = "", limit: int = 10) -> dict[str, Any]:
        """Завантажує список тендерів.
        """
        url = f"{self.BASE_URL}/tenders"
        params = {
            "offset": offset,
            "limit": limit,
            "descending": 1
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"Fetching Prozorro tenders: offset={offset}")
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Prozorro fetch error: {e!s}")
            return {"data": [], "next_page": {"offset": offset}, "error": str(e)}

    async def get_tender_details(self, tender_id: str) -> dict[str, Any] | None:
        """Отримує деталі тендера.
        """
        url = f"{self.BASE_URL}/tenders/{tender_id}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"Fetching Prozorro detail: {tender_id}")
                response = await client.get(url)
                response.raise_for_status()
                return response.json().get("data")
        except Exception as e:
            logger.error(f"Prozorro detail error: {e!s}")
            return None
