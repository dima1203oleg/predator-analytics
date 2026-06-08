"""Інтеграція з джерелами ринкових цін.

Модуль для отримання ринкових цін товарів:
- COMTRADE (UN Comtrade Database)
- ITC (International Trade Centre)
- Світові ринкові ціни
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
import logging

import httpx

logger = logging.getLogger(__name__)


@dataclass
class MarketPrice:
    """Ринкова ціна товару."""

    uktzed_code: str
    country: str
    price_min_usd: float
    price_max_usd: float
    price_avg_usd: float
    price_date: date
    confidence_level: float


class COMTRADEIntegration:
    """Інтеграція з UN Comtrade Database."""

    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        self.base_url = base_url or "https://comtradeplus.un.org"
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_market_prices(
        self,
        uktzed_code: str,
        country: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> list[MarketPrice]:
        """Отримати ринкові ціни з COMTRADE."""
        try:
            logger.info(f"Отримання цін з COMTRADE для УКТЗЕД {uktzed_code}")

            # TODO: Реалізувати реальний API виклик
            # response = await self.client.get(
            #     f"{self.base_url}/api/get",
            #     params={
            #         "freq": "A",
            #         "px": "HS",
            #         "ps": "2023",
            #         "r": "842",  # Ukraine reporter code
            #         "p": "all",
            #         "rg": "all",
            #         "cc": uktzed_code,
            #         "fmt": "json"
            #     },
            #     headers={"Authorization": f"Bearer {self.api_key}"}
            # )

            # Тимчасова заглушка
            return [
                MarketPrice(
                    uktzed_code=uktzed_code,
                    country=country or "World",
                    price_min_usd=10.0,
                    price_max_usd=100.0,
                    price_avg_usd=50.0,
                    price_date=date.today(),
                    confidence_level=0.85,
                )
            ]
        except Exception as e:
            logger.error(f"Помилка отримання цін з COMTRADE: {e}")
            return []

    async def close(self):
        """Закрити HTTP клієнт."""
        await self.client.aclose()


class ITCIntegration:
    """Інтеграція з International Trade Centre."""

    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        self.base_url = base_url or "https://api.trademap.org"
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_market_prices(
        self,
        uktzed_code: str,
        country: str | None = None,
    ) -> list[MarketPrice]:
        """Отримати ринкові ціни з ITC Trade Map."""
        try:
            logger.info(f"Отримання цін з ITC для УКТЗЕД {uktzed_code}")

            # TODO: Реалізувати реальний API виклик
            return [
                MarketPrice(
                    uktzed_code=uktzed_code,
                    country=country or "World",
                    price_min_usd=12.0,
                    price_max_usd=95.0,
                    price_avg_usd=52.0,
                    price_date=date.today(),
                    confidence_level=0.80,
                )
            ]
        except Exception as e:
            logger.error(f"Помилка отримання цін з ITC: {e}")
            return []

    async def close(self):
        """Закрити HTTP клієнт."""
        await self.client.aclose()


class MarketPriceService:
    """Сервіс для отримання ринкових цін з різних джерел."""

    def __init__(self):
        self.comtrade = COMTRADEIntegration()
        self.itc = ITCIntegration()

    async def get_aggregated_prices(
        self,
        uktzed_code: str,
        country: str | None = None,
    ) -> MarketPrice:
        """Отримати агреговані ціни з усіх джерел."""
        prices = []

        # Отримуємо з COMTRADE
        comtrade_prices = await self.comtrade.get_market_prices(uktzed_code, country)
        prices.extend(comtrade_prices)

        # Отримуємо з ITC
        itc_prices = await self.itc.get_market_prices(uktzed_code, country)
        prices.extend(itc_prices)

        # Агрегуємо
        if prices:
            avg_price = sum(p.price_avg_usd for p in prices) / len(prices)
            min_price = min(p.price_min_usd for p in prices)
            max_price = max(p.price_max_usd for p in prices)
            avg_confidence = sum(p.confidence_level for p in prices) / len(prices)

            return MarketPrice(
                uktzed_code=uktzed_code,
                country=country or "World",
                price_min_usd=min_price,
                price_max_usd=max_price,
                price_avg_usd=avg_price,
                price_date=date.today(),
                confidence_level=avg_confidence,
            )

        # Заглушка якщо немає даних
        return MarketPrice(
            uktzed_code=uktzed_code,
            country=country or "World",
            price_min_usd=0.0,
            price_max_usd=0.0,
            price_avg_usd=0.0,
            price_date=date.today(),
            confidence_level=0.0,
        )

    async def close(self):
        """Закрити всі клієнти."""
        await self.comtrade.close()
        await self.itc.close()


# Синглтон
_market_price_service: MarketPriceService | None = None


def get_market_price_service() -> MarketPriceService:
    """Отримати синглтон інстанс сервісу ринкових цін."""
    global _market_price_service
    if _market_price_service is None:
        _market_price_service = MarketPriceService()
    return _market_price_service
