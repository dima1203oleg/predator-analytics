"""
YouControl API Client (On-Demand) — PREDATOR Registry Manager
"""
import logging
import httpx
import os

logger = logging.getLogger(__name__)

class YouControlClient:
    BASE_URL = "https://api.youcontrol.com.ua/api/v2"

    def __init__(self):
        self.api_key = os.getenv("YOUCONTROL_API_KEY", "mock_key")
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {self.api_key}"},
            timeout=30.0
        )
        logger.info("Initialized YouControlClient")

    async def get_company_dossier(self, edrpou: str) -> dict:
        """
        Отримує повне досьє компанії за ЄДРПОУ.
        """
        logger.info(f"Requesting YouControl dossier for EDRPOU: {edrpou}")
        url = f"{self.BASE_URL}/company/{edrpou}/dossier"
        try:
            # Для демо повертаємо моковий JSON, якщо немає реального ключа
            if self.api_key == "mock_key":
                return {
                    "edrpou": edrpou,
                    "status": "registered",
                    "vat_payer": True,
                    "director": {"name": "Іванов Іван Іванович", "inn": "1234567890"},
                    "founders": [{"name": "ТОВ ХОЛДИНГ", "edrpou": "99999999"}],
                    "risk_score": 15
                }

            response = await self.client.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"YouControl API Error for {edrpou}: {e}")
            return {}

    async def close(self):
        await self.client.aclose()
