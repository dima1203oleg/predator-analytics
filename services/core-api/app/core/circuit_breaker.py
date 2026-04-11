"""
⚡ Circuit Breaker Pattern для PREDATOR Analytics v56.1.4

Захист від cascade failures при викликах external services (Redis, Neo4j, Kafka, LLM APIs).
"""

import time
from enum import Enum
from typing import Any, Callable, Optional

from predator_common.logging import get_logger

logger = get_logger("circuit_breaker")


class CircuitState(Enum):
    """Стани circuit breaker."""
    CLOSED = "closed"      # Нормальна робота
    OPEN = "open"          # Заблоковано (failure threshold перевищено)
    HALF_OPEN = "half_open"  # Тестування відновлення


class CircuitBreakerError(Exception):
    """Exception raised when circuit is open."""
    pass


class CircuitBreaker:
    """
    Circuit Breaker implementation для захисту від cascade failures.
    
    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Circuit tripped, requests fail immediately
    - HALF_OPEN: Testing if service recovered
    
    Usage:
        breaker = CircuitBreaker(
            name="redis",
            failure_threshold=5,
            recovery_timeout=30
        )
        
        @breaker
        async def call_redis():
            return await redis.get(key)
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 30,
        expected_exception: type = Exception,
    ):
        """
        Initialize circuit breaker.
        
        Args:
            name: Identifier for this circuit breaker
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before testing recovery
            expected_exception: Exception type that triggers circuit
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.success_count = 0
    
    def __call__(self, func: Callable) -> Callable:
        """Decorator to wrap async/sync functions."""
        import asyncio
        
        if asyncio.iscoroutinefunction(func):
            async def wrapper(*args, **kwargs):
                return await self.call(func, *args, **kwargs)
        else:
            def wrapper(*args, **kwargs):
                return self.call_sync(func, *args, **kwargs)
        
        # Preserve function metadata
        wrapper.__name__ = func.__name__
        wrapper.__doc__ = func.__doc__
        
        return wrapper
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection (async)."""
        self._check_state()
        
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure(e)
            raise
    
    def call_sync(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection (sync)."""
        self._check_state()
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure(e)
            raise
    
    def _check_state(self):
        """Check if request is allowed based on current state."""
        now = time.time()
        
        if self.state == CircuitState.OPEN:
            # Check if recovery timeout has passed
            if self.last_failure_time and (now - self.last_failure_time) > self.recovery_timeout:
                logger.info(
                    f"Circuit breaker '{self.name}' transitioning to HALF_OPEN",
                    extra={"circuit": self.name, "state": "half_open"}
                )
                self.state = CircuitState.HALF_OPEN
            else:
                logger.warning(
                    f"Circuit breaker '{self.name}' is OPEN - rejecting request",
                    extra={"circuit": self.name, "state": "open"}
                )
                raise CircuitBreakerError(
                    f"Circuit breaker '{self.name}' is open. Service unavailable."
                )
    
    def _on_success(self):
        """Handle successful execution."""
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            
            # If we have a few successes in half-open, close the circuit
            if self.success_count >= 3:
                logger.info(
                    f"Circuit breaker '{self.name}' recovered - closing circuit",
                    extra={"circuit": self.name, "state": "closed"}
                )
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.success_count = 0
        else:
            # Reset failure count on success in closed state
            self.failure_count = 0
    
    def _on_failure(self, exception: Exception):
        """Handle failed execution."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        logger.error(
            f"Circuit breaker '{self.name}' failure {self.failure_count}/{self.failure_threshold}",
            extra={
                "circuit": self.name,
                "state": self.state.value,
                "failure_count": self.failure_count,
                "error": str(exception),
            }
        )
        
        if self.failure_count >= self.failure_threshold:
            logger.critical(
                f"Circuit breaker '{self.name}' OPENED - threshold reached",
                extra={
                    "circuit": self.name,
                    "state": "open",
                    "failure_count": self.failure_count,
                }
            )
            self.state = CircuitState.OPEN
    
    def reset(self):
        """Manually reset circuit breaker."""
        logger.info(f"Circuit breaker '{self.name}' manually reset")
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None
        self.success_count = 0
    
    def get_state(self) -> dict:
        """Get current circuit breaker state."""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "failure_threshold": self.failure_threshold,
            "last_failure_time": self.last_failure_time,
            "recovery_timeout": self.recovery_timeout,
        }


# ═══════════════════════════════════════════════════════════════
# Pre-configured Circuit Breakers для різних сервісів
# ═══════════════════════════════════════════════════════════════

# Redis circuit breaker (fast failures, quick recovery)
redis_breaker = CircuitBreaker(
    name="redis",
    failure_threshold=3,
    recovery_timeout=10,
)

# Neo4j circuit breaker (moderate tolerance)
neo4j_breaker = CircuitBreaker(
    name="neo4j",
    failure_threshold=5,
    recovery_timeout=30,
)

# Kafka circuit breaker (higher tolerance for transient issues)
kafka_breaker = CircuitBreaker(
    name="kafka",
    failure_threshold=10,
    recovery_timeout=60,
)

# LLM API circuit breaker (expensive calls, conservative)
llm_breaker = CircuitBreaker(
    name="llm_api",
    failure_threshold=3,
    recovery_timeout=120,
)

# PostgreSQL circuit breaker
postgres_breaker = CircuitBreaker(
    name="postgres",
    failure_threshold=5,
    recovery_timeout=30,
)


def get_all_circuit_breakers() -> dict[str, dict]:
    """Get status of all circuit breakers."""
    return {
        "redis": redis_breaker.get_state(),
        "neo4j": neo4j_breaker.get_state(),
        "kafka": kafka_breaker.get_state(),
        "llm_api": llm_breaker.get_state(),
        "postgres": postgres_breaker.get_state(),
    }
