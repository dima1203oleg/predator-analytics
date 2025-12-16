"""
Resilience Patterns
Implements Circuit Breaker and Retry logic.
"""
import time
import asyncio
import logging
from functools import wraps
from typing import Callable, Any, Dict

logger = logging.getLogger(__name__)

class CircuitBreakerOpenException(Exception):
    pass

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60, name: str = "default"):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.name = name

        self.failures = 0
        self.state = "CLOSED" # CLOSED, OPEN, HALF-OPEN
        self.last_failure_time = 0

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                logger.info(f"Circuit {self.name} switching to HALF-OPEN")
                self.state = "HALF-OPEN"
            else:
                raise CircuitBreakerOpenException(f"Circuit {self.name} is OPEN")

        try:
            result = await func(*args, **kwargs)

            if self.state == "HALF-OPEN":
                logger.info(f"Circuit {self.name} closing after success")
                self.reset()

            return result

        except Exception as e:
            self._handle_failure()
            if isinstance(e, CircuitBreakerOpenException):
                raise e
            # Re-raise the original exception
            raise e

    def _handle_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()
        logger.warning(f"Circuit {self.name} failure {self.failures}/{self.failure_threshold}")

        if self.failures >= self.failure_threshold:
            self.state = "OPEN"
            logger.error(f"Circuit {self.name} Opened! Blocking requests for {self.recovery_timeout}s")

    def reset(self):
        self.failures = 0
        self.state = "CLOSED"

# Global registry
_breakers: Dict[str, CircuitBreaker] = {}

def get_circuit_breaker(name: str) -> CircuitBreaker:
    if name not in _breakers:
        _breakers[name] = CircuitBreaker(name=name)
    return _breakers[name]

def circuit_breaker(name: str = "default", failure_threshold: int = 5, recovery_timeout: int = 60):
    """Decorator pattern for Circuit Breaker (Async only)"""
    def decorator(func):
        # Register or get existing
        if name not in _breakers:
            _breakers[name] = CircuitBreaker(failure_threshold, recovery_timeout, name)

        cb = _breakers[name]

        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await cb.call(func, *args, **kwargs)
        return wrapper
    return decorator
