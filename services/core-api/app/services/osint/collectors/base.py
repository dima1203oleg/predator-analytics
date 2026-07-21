import abc
import asyncio
from datetime import UTC, datetime
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

class BaseOsintCollector(abc.ABC):
    """Базовий клас для всіх OSINT-колекторів (EDR, Leaks, Blockchain, etc.)
    Визначає стандартизований життєвий цикл:
    1. collect (fetch from source)
    2. save_raw (save raw JSON/HTML to MinIO Data Lake)
    3. normalize (convert to standard graph/dossier format)
    """

    def __init__(self, source_name: str, proxy: str | None = None):
        self.source_name = source_name
        self.proxy = proxy
        self.max_retries = 3
        self.timeout = 30.0

    async def _fetch(self, url: str, method: str = "GET", **kwargs) -> httpx.Response:
        """Внутрішня функція для виконання запитів із підтримкою Proxy та Retry"""
        transport = httpx.AsyncHTTPTransport(proxy=self.proxy) if self.proxy else None

        async with httpx.AsyncClient(transport=transport, timeout=self.timeout) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.request(method, url, **kwargs)
                    response.raise_for_status()
                    return response
                except httpx.HTTPError as e:
                    logger.warning(f"[{self.source_name}] Attempt {attempt + 1}/{self.max_retries} failed for {url}: {e}")
                    if attempt == self.max_retries - 1:
                        raise e
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
        raise Exception(f"Failed to fetch {url}")

    @abc.abstractmethod
    async def collect(self, query: str, **kwargs) -> dict[str, Any]:
        """Виконує запит до зовнішнього джерела.
        Повертає 'сирий' формат даних.
        """
        pass

    async def save_raw(self, identifier: str, data: dict[str, Any]) -> bool:
        """Зберігає сирі дані у MinIO (Data Lake) для аудиту та повторної обробки.
        Поки що симулюємо збереження (логіювання), оскільки MinIO клієнт
        існує в RegistryManager, але OSINT колектори можуть мати свій бакет.
        """
        try:
            timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
            filename = f"osint/{self.source_name}/{identifier}_{timestamp}.json"

            # В реальній імплементації:
            # json_bytes = json.dumps(data, ensure_ascii=False).encode('utf-8')
            # self.minio_client.put_object(...)

            logger.info(f"[MinIO Mock] Збережено сирі дані колектора {self.source_name} у файл {filename}")
            return True
        except Exception as e:
            logger.error(f"Помилка збереження сирих даних ({self.source_name}): {e}")
            return False

    @abc.abstractmethod
    def normalize(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Нормалізує сирі дані у стандартизований формат:
        {
            "nodes": [...],
            "edges": [...],
            "dossier_updates": {...}
        }
        """
        pass

    async def run_pipeline(self, query: str, identifier: str) -> dict[str, Any]:
        """Запускає повний цикл: збір -> збереження сирих даних -> нормалізація.
        """
        logger.info(f"Запуск колектора {self.source_name} для запиту: {query}")
        raw_data = await self.collect(query)

        if not raw_data:
            logger.warning(f"Колектор {self.source_name} не знайшов даних для: {query}")
            return {"nodes": [], "edges": [], "dossier_updates": {}}

        await self.save_raw(identifier, raw_data)

        normalized = self.normalize(raw_data)
        return normalized
