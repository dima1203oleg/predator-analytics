"""
NAZK API Client (Декларації) — PREDATOR Registry Manager
Автогенерується та підтримується Discovery Engine.
"""
import logging
import httpx
from typing import AsyncGenerator, Any

logger = logging.getLogger(__name__)

class NazkClient:
    BASE_URL = "https://public-api.nazk.gov.ua/v2/documents/list"
    DOC_URL = "https://public-api.nazk.gov.ua/v2/documents"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=45.0)
        logger.info("Initialized NazkClient")

    async def fetch_declarations_incremental(self, date_from: str = None) -> AsyncGenerator[dict[str, Any], None]:
        """
        Завантажує декларації інкрементально (з дати).
        Включає отримання списку та отримання кожної декларації окремо.
        """
        params = {"date_added_from": date_from} if date_from else {}
        # Pagination mock
        page = 1
        
        while True:
            params["page"] = page
            logger.info(f"Fetching NAZK declaration list page {page} since {date_from}")
            try:
                response = await self.client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()
                
                docs = data.get("data", [])
                if not docs:
                    logger.info("No more declarations found.")
                    break
                    
                for doc_meta in docs:
                    doc_id = doc_meta.get("id")
                    if doc_id:
                        # Отримуємо деталі декларації
                        doc_details = await self._fetch_declaration_details(doc_id)
                        if doc_details:
                            yield doc_details
                            
                # Check next page
                if data.get("page", {}).get("current") >= data.get("page", {}).get("total_pages", 0):
                    break
                page += 1
                
            except Exception as e:
                logger.error(f"Error fetching data from NAZK: {e}")
                break

    async def _fetch_declaration_details(self, doc_id: str) -> dict[str, Any]:
        url = f"{self.DOC_URL}/{doc_id}"
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            return response.json().get("data", {})
        except Exception as e:
            logger.error(f"Error fetching declaration {doc_id}: {e}")
            return None

    async def close(self):
        await self.client.aclose()
