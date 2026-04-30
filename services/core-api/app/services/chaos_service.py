"""Chaos Service — PREDATOR Analytics v60.5-ELITE.

Симуляція керованої деградації системи (Resilience Testing).
"""
import asyncio
from datetime import UTC, datetime, timedelta
import logging
import random
from typing import Any

logger = logging.getLogger(__name__)

class ChaosService:
    """Сервіс для ініціації хаос-експериментів (Soft Chaos)."""

    _active_experiments: dict[str, dict[str, Any]] = {}
    EXPIRATION_MINUTES = 15

    @classmethod
    def set_experiment(cls, name: str, active: bool):
        """Активація/деактивація експерименту з TTL."""
        if active:
            cls._active_experiments[name] = {
                "active": True,
                "expires_at": datetime.now(UTC) + timedelta(minutes=cls.EXPIRATION_MINUTES)
            }
            logger.warning(f"💥 Chaos Experiment '{name}' is now ACTIVE (TTL: {cls.EXPIRATION_MINUTES}m)")
        else:
            cls._active_experiments.pop(name, None)
            logger.info(f"✅ Chaos Experiment '{name}' is now INACTIVE")

    @classmethod
    def _is_active(cls, name: str) -> bool:
        """Перевірка чи активний експеримент та чи не закінчився TTL."""
        exp = cls._active_experiments.get(name)
        if not exp:
            return False

        if datetime.now(UTC) > exp["expires_at"]:
            logger.info(f"⏰ Chaos Experiment '{name}' expired and was auto-disabled")
            cls._active_experiments.pop(name, None)
            return False

        return exp["active"]

    @classmethod
    async def apply_chaos(cls) -> dict[str, Any] | None:
        """Застосування активних ефектів хаосу."""
        # 1. Симуляція затримки БД (Latency)
        if cls._is_active("db_latency"):
            delay = random.uniform(2.0, 5.0)
            logger.info(f"Chaos: Injecting {delay:.2f}s DB latency")
            await asyncio.sleep(delay)

        # 2. Симуляція відмови кешу (Redis Down simulation)
        if cls._is_active("cache_failure"):
            logger.info("Chaos: Simulating Cache Failure")
            return {"error": "Cache connection lost", "chaos": True}

        # 3. Симуляція випадкових 500 помилок
        if cls._is_active("random_errors") and random.random() < 0.2:
            logger.error("Chaos: Simulating Internal Server Error")
            raise Exception("Chaos Injected Error (500)")

        # 4. ШІ Галлюцинації (Injected Hallucination)
        if cls._is_active("llm_hallucination"):
            if random.random() < 0.3:
                logger.warning("Chaos: Injecting LLM Hallucination")
                return {"error": "Neural core desync", "hallucination": "The risk score is 999 because of Mars orbit alignment."}

        # 5. Тайм-аут агента
        if cls._is_active("agent_timeout"):
            delay = random.uniform(10.0, 30.0)
            logger.info(f"Chaos: Agent task delayed by {delay:.2f}s")
            await asyncio.sleep(delay)

        # 6. Симуляція перегріву (Overheat)
        if cls._is_active("overheat_simulation"):
            logger.warning("Chaos: System Overheat Detected (Simulation)")
            return {"status": "overheat", "vram_throttle": True}

        return None

    @classmethod
    def get_status(cls) -> dict[str, Any]:
        """Статус активних експериментів."""
        return {k: {"active": v["active"], "ttl_left": str(v["expires_at"] - datetime.now(UTC))}
                for k, v in cls._active_experiments.items()}
