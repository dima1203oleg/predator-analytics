"""YouControl API Client — PREDATOR Analytics.

OSINT конектор з Circuit Breaker для захисту від лімітів і збоїв (T2.1).
"""
import logging
from typing import Any

import httpx
from redis.asyncio import Redis

from app.config import get_settings
from app.core.circuit_breaker import CircuitBreakerOpenException, DistributedCircuitBreaker

logger = logging.getLogger("ingestion_worker.youcontrol")
settings = get_settings()


class YouControlClient:
    """Клієнт до API YouControl."""

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis = Redis.from_url(redis_url)
        self.circuit_breaker = DistributedCircuitBreaker(
            redis_client=self.redis,
            service_name="youcontrol_api",
            failure_threshold=5,
            recovery_timeout_sec=60
        )
        self.base_url = "https://api.youcontrol.com.ua"
        # Для тестування можна передати YOUCONTROL_TOKEN=mock в .env
        self.token = getattr(settings, "YOUCONTROL_TOKEN", "mock")

        self._async_client = httpx.AsyncClient(timeout=15.0)

    async def get_company_data(self, edrpou: str) -> dict[str, Any]:
        """Отримує дані компанії за ЄДРПОУ, використовуючи Circuit Breaker."""
        # Перевірка статусу Circuit Breaker
        can_execute = await self.circuit_breaker.check()
        if not can_execute:
            logger.warning("YouControl API Circuit Breaker OPEN. Використовуємо fallbacks або блокуємо запит.")
            raise CircuitBreakerOpenException("YouControl API тимчасово недоступний (Circuit Breaker OPEN)")

        # Mock-модель для локальної розробки та тестування
        if self.token == "mock":
            logger.info(f"YouControl MOCK-режим. Повертаємо тестові дані для {edrpou}")
            await self.circuit_breaker.record_success()
            return self._get_mock_data(edrpou)

        try:
            response = await self._async_client.get(
                f"{self.base_url}/company/profile/{edrpou}",
                headers={"Authorization": f"Bearer {self.token}"}
            )

            # Rate limiting (429) & Server Errors (500+)
            if response.status_code in (429, 500, 502, 503, 504):
                logger.warning(f"YouControl API Error: {response.status_code}")
                await self.circuit_breaker.record_failure()
                response.raise_for_status()

            response.raise_for_status()

            # Успішно
            await self.circuit_breaker.record_success()
            return response.json()

        except httpx.RequestError as e:
            logger.error(f"YouControl Request Exception: {e}")
            await self.circuit_breaker.record_failure()
            raise e

    def _get_mock_data(self, edrpou: str) -> dict[str, Any]:
        """Повертає mock-дані (стаба)."""
        from datetime import UTC, datetime, timedelta
        import random

        test_year = datetime.now(UTC) - timedelta(days=random.randint(100, 5000))
        return {
            "edrpou": edrpou,
            "name": f"ТОВ «Кондор-М {edrpou}»",
            "status": "registered",
            "registration_date": test_year.isoformat(),
            "director": "Коваленко Іван Петрович",
            "taxes": {"debt": bool(random.getrandbits(1))},
            "court_cases": random.randint(0, 15),
            "sanctions": False
        }

    async def close(self):
        await self._async_client.aclose()
        await self.redis.aclose()
