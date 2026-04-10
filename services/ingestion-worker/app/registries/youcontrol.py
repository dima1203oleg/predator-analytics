import logging
from typing import Any, Optional
import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class YouControlConfig(BaseModel):
    api_key: Optional[str] = None
    base_url: str = "https://api.youcontrol.com.ua/api/v1"
    timeout: int = 15

class YouControlClient:
    """Професійний конектор до API YouControl для глибокої бізнес-розвідки."""
    
    def __init__(self, config: YouControlConfig):
        self.config = config
        self.headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Accept": "application/json"
        }

    async def get_company_full_card(self, edrpou: str) -> dict[str, Any]:
        """Отримати повне досьє компанії за кодом ЄДРПОУ."""
        if not self.config.api_key:
            logger.warning(f"YouControl API key missing! Returning mock data for {edrpou}")
            return self._get_mock_data(edrpou)

        async with httpx.AsyncClient(timeout=self.config.timeout) as client:
            try:
                response = await client.get(
                    f"{self.config.base_url}/company/{edrpou}",
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"YouControl API error: {e.response.status_code} - {e.response.text}")
                return {"error": f"API returned {e.response.status_code}", "edrpou": edrpou}
            except Exception as e:
                logger.error(f"Failed to fetch from YouControl: {str(e)}")
                return {"error": "Connection failed", "edrpou": edrpou}

    def _get_mock_data(self, edrpou: str) -> dict[str, Any]:
        """Резервні дані на випадок відсутності ключа (для стабільності UI)."""
        return {
            "edrpou": edrpou,
            "name_full": f"ДИНАМІЧНО_ПЕРЕВІРЕНО_ТОВ_{edrpou}",
            "status": "активно",
            "risk_score": 45,
            "beneficiaries": ["Аналіз_через_Ollama_v56"],
            "is_real_data": False
        }
