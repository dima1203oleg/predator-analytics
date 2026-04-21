"""Chaos Service — PREDATOR Analytics v56.5-ELITE.

Симуляція керованої деградації системи (Resilience Testing).
"""
import logging
import random
import asyncio
from typing import Any
from app.core.cache import cache

logger = logging.getLogger(__name__)

class ChaosService:
    """Сервіс для ініціації хаос-експериментів (Soft Chaos)."""

    _active_experiments: dict[str, bool] = {}

    @classmethod
    def set_experiment(cls, name: str, active: bool):
        """Активація/деактивація експерименту."""
        cls._active_experiments[name] = active
        logger.warning(f"💥 Chaos Experiment '{name}' is now {'ACTIVE' if active else 'INACTIVE'}")

    @classmethod
    async def apply_chaos(cls):
        """Застосування активних ефектів хаосу."""
        # 1. Симуляція затримки БД (Latency)
        if cls._active_experiments.get("db_latency"):
            delay = random.uniform(2.0, 5.0)
            logger.info(f"Chaos: Injecting {delay:.2f}s DB latency")
            await asyncio.sleep(delay)

        # 2. Симуляція відмови кешу (Redis Down simulation)
        if cls._active_experiments.get("cache_failure"):
            logger.info("Chaos: Simulating Cache Failure")
            # У реальному коді це призведе до ігнорування кешу
            return False

        # 3. Симуляція випадкових 500 помилок
        if cls._active_experiments.get("random_errors"):
            if random.random() < 0.2:  # 20% шанс помилки
                logger.error("Chaos: Simulating Internal Server Error")
                raise Exception("Chaos Injected Error (500)")

    @classmethod
    def get_status(cls) -> dict[str, bool]:
        """Статус активних експериментів."""
        return cls._active_experiments
