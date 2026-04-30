import logging
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

class YouControlCollector:
    """Сервіс для прямого збору даних з YouControl API для Core API."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.YOUCONTROL_API_KEY
        self.base_url = "https://api.youcontrol.com.ua/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }

    async def get_dossier(self, edrpou: str) -> dict[str, Any]:
        """Отримати повне досьє компанії."""
        if self.api_key == "mock":
            logger.info(f"Using mock data for YouControl (EDRPOU: {edrpou})")
            return self._generate_mock_dossier(edrpou)

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/company/{edrpou}",
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"YouControl Collector failed: {e!s}")
                return {"error": "Source connection failed", "edrpou": edrpou}

    def _generate_mock_dossier(self, edrpou: str) -> dict[str, Any]:
        """Генерація якісних mock-даних для тестування UI."""
        return {
            "edrpou": edrpou,
            "name": "ТОВ 'ПРЕДАТОР ОСІНТ ГРУП'",
            "status": "активно",
            "risk_level": "low",
            "registration_date": "2020-01-01",
            "authorized_capital": 1000000,
            "address": "м. Київ, вул. Різницька, 1",
            "is_mock": True
        }
