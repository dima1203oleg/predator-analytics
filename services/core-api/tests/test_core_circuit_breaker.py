"""Тести для Core API Circuit Breaker (HALF_OPEN state verification)."""

import asyncio
import time
import pytest

from app.core.circuit_breaker import CircuitBreaker, CircuitState


@pytest.fixture
def cb() -> CircuitBreaker:
    return CircuitBreaker(
        name="test-core",
        failure_threshold=2,
        recovery_timeout=0.1,  # 100ms
    )


@pytest.mark.asyncio
async def test_half_open_state_blocks_parallel_requests(cb: CircuitBreaker) -> None:
    """Перевірка того, що стан HALF_OPEN дозволяє лише один зондуючий запит, а інші блокує."""
    
    async def failing():
        raise ConnectionError("Збій")
        
    async def slow_probe():
        await asyncio.sleep(0.05)
        return "success"
        
    # Доводимо до стану OPEN
    for _ in range(cb.failure_threshold):
        with pytest.raises(ConnectionError):
            await cb.call(failing)()
            
    assert cb.state == CircuitState.OPEN
    
    # Чекаємо recovery_timeout, щоб наступний запит перевів запобіжник у HALF_OPEN
    await asyncio.sleep(0.15)
    
    # Створюємо зондуючий запит, який буде виконуватись повільно
    probe_task = asyncio.create_task(cb.call(slow_probe)())
    
    # Поки зондуючий запит виконується (await asyncio.sleep), стан має бути HALF_OPEN,
    # а cb._is_probing = True. Наступні паралельні запити повинні відхилятися.
    
    # Даємо час зондуючому запиту розпочатися (зайти в call -> if -> try)
    await asyncio.sleep(0.01)
    
    assert cb.state == CircuitState.HALF_OPEN
    assert getattr(cb, "_is_probing", False) is True
    
    # Паралельний запит має отримати швидку відмову (RuntimeError)
    with pytest.raises(RuntimeError, match="Очікування результату зондування"):
        await cb.call(slow_probe)()
        
    # Чекаємо завершення першого (зондуючого) запиту
    result = await probe_task
    assert result == "success"
    
    # Після успішного зондування стан повинен повернутись до CLOSED
    assert cb.state == CircuitState.CLOSED
    assert getattr(cb, "_is_probing", False) is False
