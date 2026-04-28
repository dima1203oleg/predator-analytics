"""Circuit Breaker — захист від каскадних збоїв.

Реалізує патерн Circuit Breaker з 3 станами:
- CLOSED:    Нормальна робота. Запити проходять.
- OPEN:      Збій виявлено. Всі запити відхиляються.
- HALF_OPEN: Відновлення. Один тестовий запит.

Використання:
    cb = CircuitBreaker("neo4j", failure_threshold=5, timeout=60)

    async with cb:
        result = await neo4j_call()

    # або
    async def my_func():
        ...
    protected = cb.call(my_func)
"""

import asyncio
from collections.abc import Awaitable, Callable
from enum import Enum
import time
from typing import Any, TypeVar

T = TypeVar("T")


class CircuitState(Enum):
    """Стани Circuit Breaker."""

    CLOSED = "closed"      # Нормальна робота
    OPEN = "open"          # Відхиляє запити
    HALF_OPEN = "half_open"  # Пробний запит


class CircuitBreakerError(Exception):
    """Виняток коли Circuit Breaker у стані OPEN."""

    def __init__(self, service_name: str, reset_time: float) -> None:
        self.service_name = service_name
        self.reset_time = reset_time
        remaining = max(0.0, reset_time - time.time())
        super().__init__(
            f"Circuit Breaker OPEN для '{service_name}'. "
            f"Відновлення через {remaining:.1f}с"
        )


class CircuitBreaker:
    """Circuit Breaker з трьома станами.

    Args:
        name: Назва сервісу (для логування)
        failure_threshold: Кількість збоїв до переходу у OPEN
        timeout: Час (сек) у стані OPEN перед HALF_OPEN
        success_threshold: Кількість успіхів у HALF_OPEN для CLOSED

    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        timeout: float = 60.0,
        success_threshold: int = 1,
        **kwargs: Any,
    ) -> None:
        self.name = name
        self.failure_threshold = failure_threshold
        self.timeout = kwargs.get("reset_timeout_s", timeout)
        self.success_threshold = success_threshold

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_fail_time: float = 0.0
        self._lock = asyncio.Lock()

    @property
    def state(self) -> CircuitState:
        """Поточний стан. Автоматично переходить OPEN → HALF_OPEN після timeout."""
        if (
            self._state == CircuitState.OPEN
            and time.time() - self._last_fail_time >= self.timeout
        ):
            self._state = CircuitState.HALF_OPEN
            self._success_count = 0
        return self._state

    async def call(
        self,
        func: Callable[..., Awaitable[T]],
        *args: Any,
        **kwargs: Any,
    ) -> T:
        """Виклик функції під захистом Circuit Breaker.

        Args:
            func: Async функція для виклику
            *args: Позиційні аргументи
            **kwargs: Іменовані аргументи

        Returns:
            Результат функції

        Raises:
            CircuitBreakerError: Якщо стан OPEN
            Exception: Помилка з func (прокидається далі)

        """
        async with self._lock:
            current_state = self.state

            if current_state == CircuitState.OPEN:
                raise CircuitBreakerError(self.name, self._last_fail_time + self.timeout)

        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception:
            await self._on_failure()
            raise

    async def _on_success(self) -> None:
        """Обробка успішного виклику."""
        async with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.success_threshold:
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0
                    self._success_count = 0
            elif self._state == CircuitState.CLOSED:
                self._failure_count = 0

    async def _on_failure(self) -> None:
        """Обробка збою."""
        async with self._lock:
            self._failure_count += 1
            self._last_fail_time = time.time()

            if (
                self._state == CircuitState.HALF_OPEN
                or self._failure_count >= self.failure_threshold
            ):
                self._state = CircuitState.OPEN

    def allow_request(self) -> bool:
        """Чи дозволено запит (аналог state != OPEN)."""
        return self.state != CircuitState.OPEN

    def record_success(self) -> None:
        """Ручне логування успіху."""
        # Оскільки ці методи зазвичай викликаються поза асинхронним циклом у деяких місцях,
        # але наш клас асинхронний, ми створюємо task або використовуємо синхронний підхід
        # Проте в даному проекті вони викликаються в асинхронних функціях, тож зробимо їх асинхронними обгортками
        # або просто синхронними якщо lock не критичний для стану (але він критичний).
        # Для сумісності зробимо їх синхронними, які запускають фонову задачу або використовують thread-safe підхід.
        # Але найкраще — зробити їх асинхронними і оновити виклики.
        # Перевіримо ai_service.py: там вони викликаються з await? Ні.

        # Висновок: нам потрібні синхронні методи для сумісності.
        if self._state == CircuitState.HALF_OPEN:
            self._success_count += 1
            if self._success_count >= self.success_threshold:
                self._state = CircuitState.CLOSED
                self._failure_count = 0
                self._success_count = 0
        elif self._state == CircuitState.CLOSED:
            self._failure_count = 0

    def record_failure(self) -> None:
        """Ручне логування збою."""
        self._failure_count += 1
        self._last_fail_time = time.time()
        if self._state == CircuitState.HALF_OPEN or self._failure_count >= self.failure_threshold:
            self._state = CircuitState.OPEN

    async def __aenter__(self) -> "CircuitBreaker":
        """Вхід в асинхронний контекстний менеджер."""
        if self.state == CircuitState.OPEN:
            raise CircuitBreakerError(self.name, self._last_fail_time + self.timeout)
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Вихід з асинхронного контекстного менеджера з обробкою результату."""
        if exc_type:
            await self._on_failure()
        else:
            await self._on_success()

    def reset(self) -> None:
        """Примусово скинути стан до CLOSED (для тестів)."""
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_fail_time = 0.0

    def __repr__(self) -> str:
        """Рядкове представлення стану об'єкта."""
        return (
            f"CircuitBreaker(name={self.name!r}, state={self._state.value}, "
            f"failures={self._failure_count}/{self.failure_threshold})"
        )
