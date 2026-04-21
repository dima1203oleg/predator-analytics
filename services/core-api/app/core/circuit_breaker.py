"""PREDATOR Sovereign Circuit Breaker (v56.5).
HR-08: Ресурсний контроль та стійкість до відмов.
"""
import asyncio
import logging
import time
from enum import Enum
from functools import wraps
from typing import Any, Callable, TypeVar

T = TypeVar("T")
logger = logging.getLogger(__name__)

class CircuitState(str, Enum):
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
            logger.info(f"🟢 Circuit Breaker '{self.name}' is now CLOSED (Recovered)")

    def _on_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.error(f"🔴 Circuit Breaker '{self.name}' is now OPEN (Threshold reached)")

    def call(self, func: Callable[..., Any]):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if self.state == CircuitState.OPEN:
                if time.time() - (self.last_failure_time or 0) > self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    logger.warning(f"🟡 Circuit Breaker '{self.name}' is now HALF_OPEN (Probing...)")
                else:
                    logger.debug(f"Circuit Breaker '{self.name}' is OPEN. Fast failing.")
                    raise RuntimeError(f"Service {self.name} is temporarily unavailable (Circuit Breaker OPEN)")

            try:
                result = await func(*args, **kwargs)
                self._on_success()
                return result
            except self.expected_exception as e:
                self._on_failure()
                raise e

        return wrapper

# Спільно використовувані екземпляри
neo4j_breaker = CircuitBreaker("Neo4j", failure_threshold=3, recovery_timeout=30)
opensearch_breaker = CircuitBreaker("OpenSearch", failure_threshold=5, recovery_timeout=60)
llm_breaker = CircuitBreaker("LLM_Gateway", failure_threshold=2, recovery_timeout=10)
