"""Nominatim Harvester — Геокодування OSM об'єктів.

Забезпечує перетворення текстових адрес або назв об'єктів у географічні
координати (широта, довгота) за допомогою OpenStreetMap Nominatim API.

КРИТИЧНО: Nominatim має жорсткий ліміт — не більше 1 запиту на секунду (1 RPS).
Цей конвеєр містить вбудований Rate Limiter (Semaphore + asyncio.sleep) 
та імплементує механізм кешування (Local / Redis) для запобігання повторним
запитам до одних і тих самих адрес, що зберігає мережеві ресурси та захищає 
від бану за порушення правил (ToS).
"""

import asyncio
import hashlib
from typing import Any, Dict, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from predator_common.logging import get_logger
from app.core.etl_state import ETLStateManager

logger = get_logger("ingestion.harvesters.nominatim")

NOMINATIM_API_URL = "https://nominatim.openstreetmap.org/search"
# Обов'язковий User-Agent для Nominatim (без нього запити будуть заблоковані)
USER_AGENT = "PredatorAnalytics/57.0 (admin@predator-analytics.io)"
PIPELINE_ID = "nominatim_harvester"


class NominatimHarvester:
    """Геокодер з жорстким Rate Limiting та кешуванням."""

    def __init__(self) -> None:
        headers = {"User-Agent": USER_AGENT}
        self.http_client = httpx.AsyncClient(headers=headers, timeout=15.0)
        self.state_manager = ETLStateManager()
        # Semaphore для гарантування послідовності, хоча asyncio.sleep важливіший для 1 RPS
        self._lock = asyncio.Lock()

    def _generate_cache_key(self, query: str) -> str:
        """Створює унікальний ключ для адреси."""
        query_hash = hashlib.md5(query.lower().strip().encode('utf-8')).hexdigest()
        return f"{PIPELINE_ID}:geo_cache:{query_hash}"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=5, max=60),
        reraise=True,
    )
    async def geocode(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Виконує геокодування адреси з дотриманням 1 RPS ліміту.
        Спочатку перевіряє кеш у Redis (через ETLStateManager).
        """
        if not query or not query.strip():
            return None

        cache_key = self._generate_cache_key(query)
        cached_result = await self.state_manager.get_state(cache_key)
        
        if cached_result and "lat" in cached_result:
            logger.debug(f"NominatimHarvester: Знайдено в кеші: '{query}' -> ({cached_result['lat']}, {cached_result['lon']})")
            return cached_result

        # Гарантуємо не більше 1 запиту на секунду глобально для цього екземпляра
        async with self._lock:
            params = {
                "q": query,
                "format": "json",
                "limit": 1
            }
            
            try:
                logger.info(f"NominatimHarvester: Запит до OSM API для '{query}'...")
                response = await self.http_client.get(NOMINATIM_API_URL, params=params)
                response.raise_for_status()
                
                # Обов'язкова пауза 1.1с згідно з ToS Nominatim (1 RPS)
                await asyncio.sleep(1.1)
                
                data = response.json()
                if data and isinstance(data, list) and len(data) > 0:
                    result = data[0]
                    geo_data = {
                        "lat": float(result["lat"]),
                        "lon": float(result["lon"]),
                        "display_name": result.get("display_name"),
                        "type": result.get("type")
                    }
                    
                    # Зберігаємо результат у кеш (TTL можна налаштувати в Redis)
                    await self.state_manager.save_state(cache_key, geo_data)
                    return geo_data
                else:
                    logger.debug(f"NominatimHarvester: Результатів не знайдено для '{query}'")
                    # Кешуємо "порожній" результат, щоб не робити повторні запити для неіснуючих адрес
                    await self.state_manager.save_state(cache_key, {"not_found": True})
                    return None
                    
            except httpx.HTTPStatusError as e:
                logger.error(f"NominatimHarvester: HTTP помилка ({e.response.status_code}) для '{query}'")
                raise
            except Exception as e:
                logger.error(f"NominatimHarvester: Помилка геокодування '{query}': {e}")
                raise

    async def close(self) -> None:
        """Закриття HTTP клієнта."""
        await self.http_client.aclose()
