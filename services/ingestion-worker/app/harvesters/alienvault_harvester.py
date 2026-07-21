"""AlienVault OTX Harvester — Збирач індикаторів компрометації (IoC).

Інтегрується з Open Threat Exchange від AlienVault.
Використовує API для отримання "Пульсів" (Pulses) — колекцій IoC,
пов'язаних з певними APT-групами, кампаніями або шкідливим ПЗ.

Архітектура: Time-based fetching (завантаження пульсів, змінених після
останньої синхронізації) для підтримки актуальності бази даних кіберзагроз.
"""

import asyncio
import os
from datetime import UTC, datetime, timedelta
from typing import Any, AsyncGenerator, Dict, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from predator_common.logging import get_logger
from app.core.etl_state import ETLStateManager

logger = get_logger("ingestion.harvesters.alienvault")

OTX_API_BASE = "https://otx.alienvault.com/api/v1"
PIPELINE_ID = "alienvault_harvester"


class AlienVaultHarvester:
    """Клас для збору кіберзагроз з AlienVault OTX."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.getenv("ALIENVAULT_API_KEY", "")
        if not self.api_key:
            logger.warning("AlienVaultHarvester: ALIENVAULT_API_KEY не знайдено в оточенні!")
            
        headers = {
            "X-OTX-API-KEY": self.api_key,
            "Accept": "application/json"
        }
        self.http_client = httpx.AsyncClient(headers=headers, timeout=45.0)
        self.state_manager = ETLStateManager()

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=5, max=60),
        reraise=True,
    )
    async def _fetch_pulses_page(self, modified_since: str, page: int = 1) -> Dict[str, Any]:
        """Отримує сторінку пульсів, змінених з певної дати."""
        url = f"{OTX_API_BASE}/pulses/modified"
        params = {
            "modified_since": modified_since,
            "limit": 50,
            "page": page
        }
        
        try:
            logger.debug(f"AlienVaultHarvester: Запит пульсів (сторінка {page}) з {modified_since}")
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except httpx.HTTPStatusError as e:
            logger.error(f"AlienVaultHarvester: HTTP помилка ({e.response.status_code}) на сторінці {page}")
            raise
        except Exception as e:
            logger.error(f"AlienVaultHarvester: Системна помилка на сторінці {page}: {e}")
            raise

    async def stream_pulses(self, limit: Optional[int] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """Асинхронний генератор для видобування пульсів OTX."""
        state = await self.state_manager.get_state(PIPELINE_ID)
        
        # Якщо немає стану, завантажуємо за останні 7 днів
        default_start = (datetime.now(UTC) - timedelta(days=7)).isoformat()
        last_modified = state.get("last_modified_date", default_start)
        
        logger.info(f"AlienVaultHarvester: Початок збору пульсів, змінених з {last_modified}")
        
        current_page = 1
        yielded_count = 0
        new_last_modified = last_modified
        
        while True:
            data = await self._fetch_pulses_page(last_modified, current_page)
            results = data.get("results", [])
            
            if not results:
                logger.info("AlienVaultHarvester: Досягнуто кінця даних (немає нових пульсів).")
                break
                
            for pulse in results:
                # Відслідковуємо найновішу дату модифікації
                pulse_modified = pulse.get("modified")
                if pulse_modified and pulse_modified > new_last_modified:
                    new_last_modified = pulse_modified
                    
                yield pulse
                yielded_count += 1
                
                if limit and yielded_count >= limit:
                    logger.info(f"AlienVaultHarvester: Досягнуто ліміту ({limit}).")
                    break
                    
            if limit and yielded_count >= limit:
                break
                
            if data.get("next"):
                current_page += 1
                # Пауза для запобігання Rate Limiting (AlienVault може блокувати агресивний скрейпінг)
                await asyncio.sleep(1.0)
            else:
                break
                
        # Збереження нового стану синхронізації
        if new_last_modified > last_modified:
            await self.state_manager.save_state(
                PIPELINE_ID,
                {"last_modified_date": new_last_modified}
            )
            logger.info(f"AlienVaultHarvester: Оновлено стан синхронізації до {new_last_modified}")
            
    async def close(self) -> None:
        """Закриття HTTP клієнта."""
        await self.http_client.aclose()
