"""[DEPRECATED] OpenAlex Harvester — Наукометричний аналіз та інноваційний потенціал.

Використовує API OpenAlex для збору даних про наукові публікації (Works),
авторів та інституції. Для уникнення блокування (throttling) та потрапляння
у Polite Pool, кожен запит містить параметр `mailto` з адресою адміністратора.

Архітектура пагінації: Cursor-based pagination (параметр `cursor` у відповіді).


Цей модуль застарів. Всі нові інтеграції генеруються через AI Factory.
"""

import asyncio
from typing import Any, AsyncGenerator, Dict, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from predator_common.logging import get_logger
from app.core.etl_state import ETLStateManager

logger = get_logger("ingestion.harvesters.openalex")
logger.warning("[DEPRECATED] Цей ручний гарвестер застарів згідно з Legacy Rule. Використовуйте Autonomous AI Factory.")


OPENALEX_API_BASE = "https://api.openalex.org"
PIPELINE_ID = "openalex_harvester"

# Контактна адреса для Polite Pool (має бути налаштована через env, тут хардкод для прикладу)
POLITE_POOL_EMAIL = "admin@predator-analytics.io"


class OpenAlexHarvester:
    """Клас для збору даних з OpenAlex (Polite Pool)."""

    def __init__(self) -> None:
        self.http_client = httpx.AsyncClient(timeout=45.0)
        self.state_manager = ETLStateManager()

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=2, max=30),
        reraise=True,
    )
    async def _fetch_page(self, endpoint: str, cursor: str, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Отримує одну сторінку даних за допомогою курсору."""
        if params is None:
            params = {}
            
        # Додаємо параметри для Polite Pool та Cursor Pagination
        params["mailto"] = POLITE_POOL_EMAIL
        params["cursor"] = cursor
        # Кількість записів на сторінку (до 200 для OpenAlex)
        params["per-page"] = "200"
        
        url = f"{OPENALEX_API_BASE}/{endpoint}"
        
        try:
            logger.debug(f"OpenAlexHarvester: Запит до {url} з курсором {cursor}")
            response = await self.http_client.get(url, params=params)
            
            # Якщо 429 Too Many Requests, tenacity автоматично повторить запит (завдяки raise_for_status)
            response.raise_for_status()
            
            return response.json()
            
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenAlexHarvester: HTTP помилка ({e.response.status_code}) на курсорі {cursor}")
            raise
        except Exception as e:
            logger.error(f"OpenAlexHarvester: Системна помилка на курсорі {cursor}: {e}")
            raise

    async def stream_works(self, query_params: Optional[Dict[str, str]] = None, limit: Optional[int] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """Асинхронний генератор для видобування наукових праць (Works)."""
        state = await self.state_manager.get_state(PIPELINE_ID)
        # Якщо є збережений курсор, починаємо з нього, інакше - з початкового (*)
        current_cursor = state.get("last_cursor", "*")
        
        logger.info(f"OpenAlexHarvester: Початок збору Works з курсору {current_cursor}")
        
        yielded_count = 0
        
        while current_cursor:
            data = await self._fetch_page("works", current_cursor, query_params)
            
            meta = data.get("meta", {})
            next_cursor = meta.get("next_cursor")
            results = data.get("results", [])
            
            if not results:
                logger.info("OpenAlexHarvester: Досягнуто кінця даних.")
                break
                
            for work in results:
                yield work
                yielded_count += 1
                
                if limit and yielded_count >= limit:
                    logger.info(f"OpenAlexHarvester: Досягнуто встановленого ліміту ({limit}).")
                    break
            
            # Зберігаємо стан (cursor) після успішної обробки сторінки
            if next_cursor:
                await self.state_manager.save_state(
                    PIPELINE_ID,
                    {"last_cursor": next_cursor}
                )
                current_cursor = next_cursor
            else:
                break
                
            if limit and yielded_count >= limit:
                break
                
            # Невелика пауза для ввічливості (хоча Polite Pool дозволяє 10 запитів/сек)
            await asyncio.sleep(0.2)
            
    async def close(self) -> None:
        """Закриття HTTP клієнта."""
        await self.http_client.aclose()
