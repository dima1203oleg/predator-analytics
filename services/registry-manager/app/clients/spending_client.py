"""
Spending.gov.ua API Client — PREDATOR Registry Manager
Автогенерується та підтримується Discovery Engine.
"""
import logging
import httpx
from typing import AsyncGenerator, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class SpendingClient:
    BASE_URL = "https://api.spending.gov.ua/api/v2/api/transactions"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=45.0)
        logger.info("Initialized SpendingClient")

    async def fetch_transactions_by_date(self, target_date: str) -> AsyncGenerator[dict[str, Any], None]:
        """
        Завантажує транзакції за вказану дату (формат YYYY-MM-DD).
        API не віддає весь дамп, тому ми запитуємо по днях.
        """
        params = {"startdate": target_date, "enddate": target_date}
        url = self.BASE_URL
        logger.info(f"Fetching Spending transactions for {target_date}")
        
        try:
            # У реальності тут може бути пагінація, якщо транзакцій занадто багато
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            # API Spending.gov.ua повертає список об'єктів
            transactions = response.json()
            if not transactions:
                logger.info(f"No transactions found for {target_date}.")
                return
                
            for tx in transactions:
                yield tx
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred while fetching Spending API: {e}")
        except Exception as e:
            logger.error(f"Error fetching data from Spending API: {e}")

    async def close(self):
        await self.client.aclose()
