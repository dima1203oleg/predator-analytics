"""[DEPRECATED] NAZK Harvester — ELT конвеєр для Єдиного державного реєстру декларацій.

Реалізує патерн Extract-Load-Transform (ELT). Замість складної нормалізації
в пам'яті під час завантаження, цей збирач витягує "schema-less" JSON 
декларацій "як є" (as-is) і відправляє їх у raw-шар сховища (Data Lake/Kafka)
для подальшої глибокої обробки та розкладання на сутності (PEP, активи).

Використовує механізм відстеження ID останньої обробленої декларації.


Цей модуль застарів. Всі нові інтеграції генеруються через AI Factory.
"""

import asyncio
from typing import Any, AsyncGenerator, Dict, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from predator_common.logging import get_logger
from app.core.etl_state import ETLStateManager

logger = get_logger("ingestion.harvesters.nazk")
logger.warning("[DEPRECATED] Цей ручний гарвестер застарів згідно з Legacy Rule. Використовуйте Autonomous AI Factory.")


# Базовий URL для відкритого API НАЗК (декларації)
NAZK_API_URL = "https://public-api.nazk.gov.ua/v2/documents/list"
PIPELINE_ID = "nazk_harvester"


class NazkHarvester:
    """ELT збирач для декларацій НАЗК (PEP)."""

    def __init__(self) -> None:
        self.http_client = httpx.AsyncClient(timeout=45.0)
        self.state_manager = ETLStateManager()

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=2, min=3, max=30),
        reraise=True,
    )
    async def _fetch_documents_page(self, page: int) -> Dict[str, Any]:
        """Отримує сторінку з реєстру документів."""
        # Для НАЗК зазвичай передається тип документу (1 - щорічна декларація)
        params = {
            "page": page,
            "declarationType": 1 
        }
        
        try:
            logger.debug(f"NazkHarvester: Запит сторінки декларацій {page}...")
            response = await self.http_client.get(NAZK_API_URL, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except httpx.HTTPStatusError as e:
            logger.error(f"NazkHarvester: HTTP помилка ({e.response.status_code}) на сторінці {page}")
            raise
        except Exception as e:
            logger.error(f"NazkHarvester: Системна помилка на сторінці {page}: {e}")
            raise

    async def stream_declarations(self, limit: Optional[int] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """Асинхронний генератор (ELT) для витягування сирих декларацій."""
        state = await self.state_manager.get_state(PIPELINE_ID)
        
        # Визначаємо з якої сторінки продовжувати (якщо було перервано)
        current_page = state.get("last_processed_page", 1)
        
        logger.info(f"NazkHarvester: Початок ELT збору декларацій НАЗК, сторінка {current_page}")
        
        yielded_count = 0
        
        while True:
            data = await self._fetch_documents_page(current_page)
            documents = data.get("data", [])
            
            if not documents:
                logger.info(f"NazkHarvester: Досягнуто кінця даних на сторінці {current_page}.")
                break
                
            for doc in documents:
                # В режимі ELT ми не парсимо структуру "step_1", "step_2" і т.д.
                # Ми віддаємо сирий JSON як є (as-is).
                yield doc
                yielded_count += 1
                
                if limit and yielded_count >= limit:
                    break
                    
            # Зберігаємо прогрес сторінки
            await self.state_manager.save_state(
                PIPELINE_ID,
                {"last_processed_page": current_page}
            )
            
            if limit and yielded_count >= limit:
                logger.info(f"NazkHarvester: Досягнуто встановленого ліміту у {limit} записів.")
                break
                
            # Перевіряємо чи є наступна сторінка
            links = data.get("links", {})
            if links.get("next"):
                current_page += 1
                # Невелика пауза для запобігання надмірному навантаженню на держреєстр
                await asyncio.sleep(0.5)
            else:
                break
                
    async def close(self) -> None:
        """Закриття HTTP клієнта."""
        await self.http_client.aclose()
