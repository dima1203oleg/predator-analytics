"""[DEPRECATED] Spending Harvester — Збирач транзакцій з Державного вебпорталу бюджетних коштів (E-data).

Використовує хронологічну сегментацію (мікробатчі по днях) для 
уникнення таймаутів (HTTP 504) при завантаженні транзакцій.
Забезпечує фінансову точність через перетворення сум транзакцій 
у тип Decimal під час трансформації.


Цей модуль застарів. Всі нові інтеграції генеруються через AI Factory.
"""

import asyncio
from collections.abc import AsyncGenerator
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.etl_state import ETLStateManager
from predator_common.logging import get_logger

logger = get_logger("ingestion.harvesters.spending")
logger.warning("[DEPRECATED] Цей ручний гарвестер застарів згідно з Legacy Rule. Використовуйте Autonomous AI Factory.")


# Офіційний API E-data (Spending.gov.ua)
SPENDING_API_URL = "https://api.spending.gov.ua/api/v2/api/transactions/"
PIPELINE_ID = "spending_harvester"


class SpendingHarvester:
    """Клас для збору бюджетних транзакцій з Spending.gov.ua."""

    def __init__(self) -> None:
        self.http_client = httpx.AsyncClient(timeout=60.0)
        self.state_manager = ETLStateManager()

    def _normalize_amount(self, amount: Any) -> Decimal | None:
        """Точна конвертація суми в Decimal."""
        if amount is None:
            return None
        try:
            return Decimal(str(amount))
        except InvalidOperation:
            logger.warning(f"SpendingHarvester: Неможливо конвертувати суму {amount} в Decimal")
            return None

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=5, max=60),
        reraise=True,
    )
    async def _fetch_daily_transactions(self, target_date: date) -> list[dict[str, Any]]:
        """Завантажує транзакції за один конкретний день (мікробатч)."""
        date_str = target_date.isoformat()
        logger.info(f"SpendingHarvester: Запит транзакцій за {date_str}...")

        params = {
            "startdate": date_str,
            "enddate": date_str
        }

        try:
            # API Spending часто повертає великі масиви даних, що викликає навантаження
            response = await self.http_client.get(SPENDING_API_URL, params=params)
            response.raise_for_status()

            data = response.json()
            transactions = data if isinstance(data, list) else data.get("transactions", [])
            logger.info(f"SpendingHarvester: Отримано {len(transactions)} транзакцій за {date_str}.")

            # Трансформація
            normalized = []
            for tx in transactions:
                # Обов'язкова конвертація в Decimal для фінансової точності
                tx["amount"] = self._normalize_amount(tx.get("amount"))
                normalized.append(tx)

            return normalized

        except httpx.HTTPStatusError as e:
            logger.error(f"SpendingHarvester: HTTP помилка під час збору Spending за {date_str}: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"SpendingHarvester: Системна помилка під час збору Spending за {date_str}: {e}")
            raise

    async def stream_historical(self, start_date: date, end_date: date) -> AsyncGenerator[dict[str, Any], None]:
        """Оркестрація історичного завантаження за допомогою мікробатчів (Streaming)."""
        current_date = start_date
        total_days = (end_date - start_date).days + 1

        logger.info(f"SpendingHarvester: Початок потокового завантаження ({total_days} днів).")

        while current_date <= end_date:
            state = await self.state_manager.get_state(PIPELINE_ID)
            processed_dates = state.get("processed_dates", [])

            date_str = current_date.isoformat()
            if date_str in processed_dates:
                logger.info(f"SpendingHarvester: Пропускаємо {date_str}, вже оброблено.")
            else:
                # Виконуємо запит
                transactions = await self._fetch_daily_transactions(current_date)

                # Віддаємо транзакції поштучно
                for tx in transactions:
                    yield tx

                # Зберігаємо стан (commit) після успішної видачі всіх транзакцій за день
                processed_dates.append(date_str)
                await self.state_manager.save_state(
                    PIPELINE_ID,
                    {
                        "last_processed_date": date_str,
                        "processed_dates": processed_dates[-30:] # Зберігаємо останні 30 днів для економії пам'яті
                    }
                )

                # Пауза між батчами для "polite harvesting"
                await asyncio.sleep(2.0)

            current_date += timedelta(days=1)

    async def close(self) -> None:
        """Закриття HTTP клієнта."""
        await self.http_client.aclose()
