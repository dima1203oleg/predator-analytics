"""NBU Harvester — Збирач офіційних курсів валют від Національного банку України.

Цей модуль завантажує курси валют з API НБУ, які використовуються 
як Dimension Table для конвертації всіх фінансових транзакцій платформи 
у єдиний еквівалент (наприклад, для аналізу транзакцій Spending або контрактів ProZorro).
"""

import asyncio
from datetime import UTC, datetime
from typing import Any, Dict, List

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from predator_common.logging import get_logger

logger = get_logger("ingestion.harvesters.nbu")

NBU_EXCHANGE_URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json"


class NBUHarvester:
    """Клас для збору щоденних курсів валют з НБУ.
    
    API НБУ є відкритим, не потребує авторизації та відзначається високою стабільністю.
    Виконується як мікро-завдання для заповнення Dimension Table.
    """

    def __init__(self) -> None:
        self.http_client = httpx.AsyncClient(timeout=30.0)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def fetch_exchange_rates(self) -> List[Dict[str, Any]]:
        """Завантажує актуальні курси валют з повторними спробами (Circuit Breaker/Retry)."""
        try:
            logger.info("NBUHarvester: Отримання актуальних курсів валют...")
            response = await self.http_client.get(NBU_EXCHANGE_URL)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"NBUHarvester: Успішно отримано {len(data)} курсів валют.")
            
            # Базова валідація/трансформація
            normalized_rates = []
            now_ts = datetime.now(UTC).isoformat()
            
            for item in data:
                normalized_rates.append({
                    "currency_code": item.get("cc"),
                    "currency_name": item.get("txt"),
                    "rate": item.get("rate"),
                    "exchange_date": item.get("exchangedate"),
                    "extracted_at": now_ts,
                })
                
            return normalized_rates
            
        except httpx.HTTPStatusError as e:
            logger.error(f"NBUHarvester: HTTP помилка під час збору курсів валют: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"NBUHarvester: Системна помилка під час збору курсів валют: {e}")
            raise
            
    async def close(self) -> None:
        """Закриття HTTP клієнта."""
        await self.http_client.aclose()
