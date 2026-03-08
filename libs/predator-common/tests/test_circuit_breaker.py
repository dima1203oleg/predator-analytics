"""Тести для Circuit Breaker."""

import asyncio
import pytest
from predator_common.circuit_breaker import CircuitBreaker, CircuitBreakerError, CircuitState


@pytest.fixture
def cb() -> CircuitBreaker:
    """Фікстура: Circuit Breaker з низькими порогами для тестів."""
    return CircuitBreaker(
        name="test-service",
        failure_threshold=3,
        timeout=0.1,  # 100ms для швидких тестів
        success_threshold=1,
    )


class TestCircuitBreakerState:
    """Тести переходів між станами."""

    def test_initial_state_is_closed(self, cb: CircuitBreaker) -> None:
        """Початковий стан — CLOSED."""
        assert cb.state == CircuitState.CLOSED

    @pytest.mark.asyncio
    async def test_stays_closed_on_success(self, cb: CircuitBreaker) -> None:
        """Успішні виклики не змінюють стан CLOSED."""
        async def success() -> str:
            return "ok"

        for _ in range(10):
            await cb.call(success)

        assert cb.state == CircuitState.CLOSED

    @pytest.mark.asyncio
    async def test_opens_after_threshold_failures(self, cb: CircuitBreaker) -> None:
        """Після failure_threshold збоїв → OPEN."""
        async def failing() -> None:
            raise ConnectionError("Недоступний")

        for _ in range(cb.failure_threshold):
            with pytest.raises(ConnectionError):
                await cb.call(failing)

        assert cb.state == CircuitState.OPEN

    @pytest.mark.asyncio
    async def test_rejects_when_open(self, cb: CircuitBreaker) -> None:
        """У стані OPEN → CircuitBreakerError."""
        async def failing() -> None:
            raise ConnectionError("Недоступний")

        for _ in range(cb.failure_threshold):
            with pytest.raises(ConnectionError):
                await cb.call(failing)

        with pytest.raises(CircuitBreakerError):
            await cb.call(failing)

    @pytest.mark.asyncio
    async def test_transitions_to_half_open_after_timeout(
        self, cb: CircuitBreaker
    ) -> None:
        """Після timeout → HALF_OPEN."""
        async def failing() -> None:
            raise ConnectionError("Недоступний")

        for _ in range(cb.failure_threshold):
            with pytest.raises(ConnectionError):
                await cb.call(failing)

        assert cb.state == CircuitState.OPEN
        await asyncio.sleep(cb.timeout + 0.05)
        assert cb.state == CircuitState.HALF_OPEN

    @pytest.mark.asyncio
    async def test_closes_after_success_in_half_open(
        self, cb: CircuitBreaker
    ) -> None:
        """Успіх у HALF_OPEN → CLOSED."""
        async def failing() -> None:
            raise ConnectionError("Недоступний")

        async def success() -> str:
            return "ok"

        for _ in range(cb.failure_threshold):
            with pytest.raises(ConnectionError):
                await cb.call(failing)

        await asyncio.sleep(cb.timeout + 0.05)
        assert cb.state == CircuitState.HALF_OPEN

        await cb.call(success)
        assert cb.state == CircuitState.CLOSED


class TestCircuitBreakerReset:
    """Тести скидання стану."""

    @pytest.mark.asyncio
    async def test_reset_clears_state(self, cb: CircuitBreaker) -> None:
        """reset() повертає до CLOSED."""
        async def failing() -> None:
            raise ConnectionError("Недоступний")

        for _ in range(cb.failure_threshold):
            with pytest.raises(ConnectionError):
                await cb.call(failing)

        assert cb.state == CircuitState.OPEN
        cb.reset()
        assert cb.state == CircuitState.CLOSED
