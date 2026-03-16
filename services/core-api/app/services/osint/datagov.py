import logging
from typing import Any

import httpx

logger = logging.getLogger("core-api.osint.datagov")

class DataGovUACollector:
    """Асинхронний колектор для Порталу відкритих даних України (data.gov.ua).
    Використовує CKAN API v3.
    """

    BASE_URL = "https://data.gov.ua/api/3/action"

    async def search_datasets(self, query: str = "", rows: int = 10, start: int = 0) -> dict[str, Any]:
        """Пошук наборів даних (packages) за запитом.
        """
        url = f"{self.BASE_URL}/package_search"
        params = {
            "q": query or "*:*",
            "rows": rows,
            "start": start
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"Searching DataGovUA: query='{query}', rows={rows}")
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"DataGovUA search error: {e!s}")
            return {"success": False, "error": str(e)}

    async def get_dataset_details(self, dataset_id: str) -> dict[str, Any]:
        """Отримання повної інформації про датасет.
        """
        url = f"{self.BASE_URL}/package_show"
        params = {"id": dataset_id}

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"Fetching DataGovUA dataset: {dataset_id}")
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"DataGovUA fetch error: {e!s}")
            return {"success": False, "error": str(e)}
