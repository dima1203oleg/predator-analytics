"""PREDATOR Sovereign Circuit Breaker (v56.5).
HR-08: Ресурсний контроль та стійкість до відмов.
"""
from collections.abc import Callable
from enum import StrEnum
from functools import wraps
import logging
import time
from typing import Any, TypeVar

T = TypeVar("T")
logger = logging.getLogger(__name__)

class CircuitState(StrEnum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    """Запобіжник для запобігання каскадним відмовам."""

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type[Exception] = Exception
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        self.state = CircuitState.CLOSED
        self.failures = 0
        self.last_failure_time: float | None = None

    def _on_success(self):
        self.failures = 0
        self.state = CircuitState.CLOSED
        if self.state == CircuitState.HALF_OPEN:
            logger.info(f"🟢 Запобіжник '{self.name}' тепер ЗАКРИТИЙ (Відновлено)")

    def _on_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.error(f"🔴 Запобіжник '{self.name}' тепер ВІДКРИТИЙ (Досягнуто ліміту помилок)")

    def call(self, func: Callable[..., Any]):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if self.state == CircuitState.OPEN:
                if time.time() - (self.last_failure_time or 0) > self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    logger.warning(f"🟡 Запобіжник '{self.name}' тепер НАПІВВІДКРИТИЙ (Зондування...)")
                else:
                    logger.debug(f"Запобіжник '{self.name}' ВІДКРИТИЙ. Швидка відмова.")
                    raise RuntimeError(f"Сервіс {self.name} тимчасово недоступний (Запобіжник ВІДКРИТИЙ)")

            if self.state == CircuitState.HALF_OPEN:
                if getattr(self, '_is_probing', False):
                    logger.debug(f"Запобіжник '{self.name}' ВЖЕ зондується. Швидка відмова.")
                    raise RuntimeError(f"Сервіс {self.name} тимчасово недоступний (Очікування результату зондування)")
                self._is_probing = True

            try:
                result = await func(*args, **kwargs)
                self._is_probing = False
                self._on_success()
                return result
            except self.expected_exception as e:
                self._is_probing = False
                self._on_failure()
                raise e

        return wrapper

# Спільно використовувані екземпляри
neo4j_breaker = CircuitBreaker("Neo4j", failure_threshold=3, recovery_timeout=30)
opensearch_breaker = CircuitBreaker("OpenSearch", failure_threshold=5, recovery_timeout=60)
llm_breaker = CircuitBreaker("LLM_Gateway", failure_threshold=2, recovery_timeout=10)
