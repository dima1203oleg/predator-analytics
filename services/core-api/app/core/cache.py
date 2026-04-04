"""Cache Core — Декоратор для кешування відповідей FastAPI в Redis.
Покращує продуктивність аналітичних ендпоїнтів.
"""
from collections.abc import Callable
import functools
import hashlib
from typing import ParamSpec, TypeVar

from fastapi import Request
from pydantic_core import to_jsonable_python

from app.services.redis_service import get_redis_service
from predator_common.logging import get_logger

logger = get_logger("core.cache")

P = ParamSpec("P")
R = TypeVar("R")


from predator_common.logging import get_logger

logger = get_logger("core.cache")


def cache_response(ttl: int = 300, key_prefix: str = "api_cache") -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Декоратор для кешування результатів асинхронних функцій роутера.

    Кешує результат на основі:
    - Шляху (URL path)
    - Query параметрів
    - Тіла запиту (якщо є)
    """

    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            # Знаходимо request у аргументах
            request: Request | None = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                request = kwargs.get("request")  # type: ignore # Request is passed as a keyword argument by FastAPI

            # Якщо не вдалося знайти Request, просто виконуємо функцію без кешування
            if not request:
                logger.warning("Request object not found in arguments, skipping cache for %s", func.__name__)
                return await func(*args, **kwargs)

            # Формуємо унікальний ключ кешу
            cache_key = _generate_cache_key(request, key_prefix, func.__name__)

            redis = get_redis_service()

            # Спробувати отримати з кешу
            cached_data = await redis.cache_get(cache_key)
            if cached_data:
                logger.debug("Cache HIT for %s", request.url.path)
                return cached_data

            # Виконання оригінальної функції
            logger.debug("Cache MISS for %s. Executing...", request.url.path)
            result = await func(*args, **kwargs)

            # Збереження результату в кеш
            # Використовуємо pydantic_core.to_jsonable_python для коректної серіалізації
            serializable_result = to_jsonable_python(result) # type: ignore # result might not be directly BaseModel, but pydantic_core handles common types

            await redis.cache_set(cache_key, serializable_result, ttl_seconds=ttl)

            return result

        return wrapper

    return decorator


def _generate_cache_key(request: Request, prefix: str, func_name: str) -> str:
    """Генерує детермінований ключ кешу на основі параметрів запиту."""
    path = request.url.path
    query_params = str(sorted(request.query_params.items()))

    # TODO: Додати хешування тіла запиту, якщо воно є, для POST/PUT/PATCH запитів.
    # Наразі кешуємо тільки GET запити.

    # Створюємо хеш від параметрів
    key_content = f"{func_name}:{path}:{query_params}"
    key_hash = hashlib.md5(key_content.encode()).hexdigest()

    return f"{prefix}:{key_hash}"

