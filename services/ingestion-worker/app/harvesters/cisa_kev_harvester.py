"""CISA KEV Harvester — Збирач каталогу відомих вразливостей (Known Exploited Vulnerabilities).

Дані розповсюджуються Агентством з кібербезпеки США (CISA) у вигляді 
статичного JSON-документа. Конвеєр розраховує хеш-суму файлу для визначення змін 
і забезпечує завантаження лише оновлених записів (UPSERT).
"""

import asyncio
import hashlib
from datetime import UTC, datetime
from typing import Any, Dict, List, Optional

import httpx
import orjson
from tenacity import retry, stop_after_attempt, wait_exponential

from predator_common.logging import get_logger
from app.core.etl_state import ETLStateManager

logger = get_logger("ingestion.harvesters.cisa_kev")

CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
PIPELINE_ID = "cisa_kev_harvester"


class CisaKevHarvester:
    """Клас для збору каталогу CISA KEV."""

    def __init__(self) -> None:
        self.http_client = httpx.AsyncClient(timeout=60.0)
        self.state_manager = ETLStateManager()

    def _calculate_hash(self, content: bytes) -> str:
        """Обчислює SHA-256 хеш-суму завантажених даних."""
        return hashlib.sha256(content).hexdigest()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def fetch_vulnerabilities(self) -> Optional[List[Dict[str, Any]]]:
        """Завантажує каталог вразливостей, перевіряючи зміни за хеш-сумою."""
        try:
            logger.info("CisaKevHarvester: Отримання каталогу CISA KEV...")
            response = await self.http_client.get(CISA_KEV_URL)
            response.raise_for_status()
            
            raw_content = response.content
            current_hash = self._calculate_hash(raw_content)
            
            # Перевіряємо стан у Redis
            state = await self.state_manager.get_state(PIPELINE_ID)
            previous_hash = state.get("last_hash")
            
            if previous_hash == current_hash:
                logger.info("CisaKevHarvester: Змін у каталозі не виявлено (хеші співпадають). Завершення роботи.")
                return None  # Немає нових даних для обробки
            
            # Якщо є зміни, парсимо JSON
            data = orjson.loads(raw_content)
            vulnerabilities = data.get("vulnerabilities", [])
            logger.info(f"CisaKevHarvester: Успішно отримано {len(vulnerabilities)} записів.")
            
            # Оновлюємо стан у Redis
            now_ts = datetime.now(UTC).isoformat()
            await self.state_manager.save_state(
                PIPELINE_ID, 
                {
                    "last_hash": current_hash,
                    "last_updated": now_ts,
                    "total_records": len(vulnerabilities)
                }
            )
            
            return vulnerabilities
            
        except httpx.HTTPStatusError as e:
            logger.error(f"CisaKevHarvester: HTTP помилка: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"CisaKevHarvester: Системна помилка: {e}")
            raise
            
    async def close(self) -> None:
        """Закриття HTTP клієнта."""
        await self.http_client.aclose()
