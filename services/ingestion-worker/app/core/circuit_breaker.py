"""Circuit Breaker — PREDATOR Analytics v55.2.

Розподілений Circuit Breaker на базі Redis для OSINT інтеграцій.
"""
from enum import Enum
import logging
import time

from redis.asyncio import Redis

logger = logging.getLogger("ingestion_worker.circuit_breaker")


class CircuitState(Enum):
    CLOSED = "CLOSED"      # Працює нормально
    OPEN = "OPEN"          # Заблоковано, швидка відмова
    HALF_OPEN = "HALF_OPEN" # Тестовий режим (1 запит)


class DistributedCircuitBreaker:
    """Розподілений Circuit Breaker для зовнішніх API."""

    def __init__(
        self,
        redis_client: Redis,
        service_name: str,
        failure_threshold: int = 5,
        recovery_timeout_sec: int = 60,
    ):
        self.redis = redis_client
        self.service_name = service_name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout_sec

        self.key_failures = f"cb:{service_name}:failures"
        self.key_state = f"cb:{service_name}:state"
        self.key_last_failure = f"cb:{service_name}:last_failure"

    async def get_state(self) -> CircuitState:
        """Повертає поточний стан Circuit Breaker."""
        state = await self.redis.get(self.key_state)
        if not state:
            return CircuitState.CLOSED

        state_str = state.decode("utf-8")
        if state_str == CircuitState.OPEN.value:
            # Перевіряємо чи пройшов час recovery
            last_failure = await self.redis.get(self.key_last_failure)
            if last_failure:
                time_since_failure = time.time() - float(last_failure.decode("utf-8"))
                if time_since_failure >= self.recovery_timeout:
                    # Перехід в HALF_OPEN
                    await self.redis.set(self.key_state, CircuitState.HALF_OPEN.value)
                    return CircuitState.HALF_OPEN

        return CircuitState(state_str)

    async def record_failure(self) -> None:
        """Реєструє помилку до зовнішнього API."""
        failures = await self.redis.incr(self.key_failures)
        await self.redis.set(self.key_last_failure, str(time.time()))

        if failures >= self.failure_threshold:
            current_state = await self.get_state()
            if current_state != CircuitState.OPEN:
                logger.warning(f"Circuit Breaker для {self.service_name} перейшов у стан OPEN!")
                await self.redis.set(self.key_state, CircuitState.OPEN.value)

    async def record_success(self) -> None:
        """Реєструє успішний запит."""
        current_state = await self.get_state()
        if current_state in (CircuitState.OPEN, CircuitState.HALF_OPEN):
            logger.info(f"Circuit Breaker для {self.service_name} перейшов у стан CLOSED (Відновлено).")

        await self.redis.set(self.key_state, CircuitState.CLOSED.value)
        await self.redis.set(self.key_failures, 0)

    async def check(self) -> bool:
        """Перевіряє чи дозволено виконати запит.
        Returns False, якщо Circuit Breaker OPEN.
        """
        state = await self.get_state()
        if state == CircuitState.OPEN:
            return False

        if state == CircuitState.HALF_OPEN:
            # Atomic lock for HALF_OPEN to allow ONLY ONE test request
            lock_key = f"cb:{self.service_name}:half_open_lock"
            acquired = await self.redis.set(lock_key, "1", nx=True, ex=10)
            if not acquired:
                return False  # Інший процес вже робить тестовий запит

        return True

class CircuitBreakerOpenException(Exception):
    """Кидається, коли Circuit Breaker відкритий."""

    pass
