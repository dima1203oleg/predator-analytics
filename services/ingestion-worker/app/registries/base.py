"""Базові класи для взаємодії з державними реєстрами України.
Відповідно до HR-01 (Python 3.12) та політики open-source.
"""
from abc import ABC, abstractmethod
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

class БазовийРеєстрКлієнт(ABC):
    """Абстрактний клас для всіх клієнтів державних реєстрів (ЄДР, Судовий Реєстр тощо)."""

    def __init__(self, base_url: str, api_key: str | None = None) -> None:
        self.base_url = base_url
        self.api_key = api_key
        # Використовуємо асинхронний клієнт для високої продуктивності
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    async def _зробити_запит(self, endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """Універсальний метод для виконання GET-запитів до API реєстрів."""
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            response = await self.client.get(endpoint, params=params, headers=headers)
            response.raise_for_status()
            return response.json()  # type: ignore
        except httpx.HTTPStatusError as e:
            logger.error(f"Помилка HTTP під час запиту до {endpoint}: {e}")
            raise
        except Exception as e:
            logger.error(f"Неочікувана помилка запиту до {endpoint}: {e}")
            raise

    @abstractmethod
    async def знайти_за_єдрпоу(self, edrpou: str) -> dict[str, Any]:
        """Абстрактний метод пошуку компанії за кодом ЄДРПОУ."""
        pass

    async def закрити(self) -> None:
        """Закриття HTTP клієнта."""
        await self.client.aclose()
