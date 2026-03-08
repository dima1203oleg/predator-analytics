"""
Retry — повторні спроби з exponential backoff.

Використання:
    @retry_async(max_attempts=3, base_delay=1.0)
    async def call_api() -> dict:
        ...

    # або як контекстний менеджер
    result = await retry_async(max_attempts=3)(my_function)()
"""

import asyncio
import functools
import random
import time
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

T = TypeVar("T")


def retry_async(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    jitter: bool = True,
    retry_on: tuple[type[Exception], ...] = (Exception,),
) -> Callable[[Callable[..., Awaitable[T]]], Callable[..., Awaitable[T]]]:
    """
    Декоратор для async функцій: exponential backoff retry.

    Args:
        max_attempts: Максимальна кількість спроб (включно з першою)
        base_delay: Початкова затримка (сек)
        max_delay: Максимальна затримка (сек)
        backoff_factor: Множник для затримки (2.0 = подвоєння)
        jitter: Додати випадковість (уникнення thundering herd)
        retry_on: Tuple типів винятків для повторної спроби

    Returns:
        Декоратор

    Приклад:
        @retry_async(max_attempts=3, retry_on=(ConnectionError, TimeoutError))
        async def fetch_data() -> dict:
            ...
    """
    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exception: Exception | None = None

            for attempt in range(1, max_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except retry_on as exc:  # type: ignore[misc]
                    last_exception = exc

                    if attempt == max_attempts:
                        break

                    delay = min(
                        base_delay * (backoff_factor ** (attempt - 1)),
                        max_delay,
                    )
                    if jitter:
                        delay *= random.uniform(0.5, 1.5)  # noqa: S311

                    await asyncio.sleep(delay)

            assert last_exception is not None
            raise last_exception

        return wrapper
    return decorator


def retry_sync(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    jitter: bool = True,
    retry_on: tuple[type[Exception], ...] = (Exception,),
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    Декоратор для sync функцій: exponential backoff retry.

    Аргументи аналогічні до retry_async.
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exception: Exception | None = None

            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except retry_on as exc:  # type: ignore[misc]
                    last_exception = exc

                    if attempt == max_attempts:
                        break

                    delay = min(
                        base_delay * (backoff_factor ** (attempt - 1)),
                        max_delay,
                    )
                    if jitter:
                        delay *= random.uniform(0.5, 1.5)  # noqa: S311

                    time.sleep(delay)

            assert last_exception is not None
            raise last_exception

        return wrapper
    return decorator
