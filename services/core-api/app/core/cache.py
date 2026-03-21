\"\"\"Cache Core — Декоратор для кешування відповідей FastAPI в Redis.
Покращує продуктивність аналітичних ендпоїнтів.
\"\"\"
import functools
import hashlib
from typing import Any, Callable

from fastapi import Request
from pydantic import BaseModel

from app.services.redis_service import get_redis_service
from predator_common.logging import get_logger

logger = get_logger("core.cache")


def cache_response(ttl: int = 300, key_prefix: str = "api_cache"):
    \"\"\"Декоратор для кешування результатів асинхронних функцій роутера.

    Кешує результат на основі:
    - Шляху (URL path)
    - Query параметрів
    - Тіла запиту (якщо є)
    \"\"\"

    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Знаходимо request у аргументах
            request: Request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                request = kwargs.get("request")

            # Якщо не вдалося знайти Request, просто виконуємо функцію без кешування
            if not request:
                return await func(*args, **kwargs)

            # Формуємо унікальний ключ кешу
            cache_key = _generate_cache_key(request, key_prefix, func.__name__)
            
            redis = get_redis_service()
            
            # Спробувати отримати з кешу
            cached_data = await redis.cache_get(cache_key)
            if cached_data:
                logger.debug(f"Cache HIT for {request.url.path}")
                return cached_data

            # Виконання оригінальної функції
            logger.debug(f"Cache MISS for {request.url.path}. Executing...")
            result = await func(*args, **kwargs)

            # Збереження результату в кеш
            serializable_result = result
            if isinstance(result, list):
                serializable_result = [i.model_dump() if isinstance(i, BaseModel) else i for i in result]
            elif isinstance(result, BaseModel):
                serializable_result = result.model_dump()

            await redis.cache_set(cache_key, serializable_result, ttl_seconds=ttl)
            
            return result

        return wrapper

    return decorator


def _generate_cache_key(request: Request, prefix: str, func_name: str) -> str:
    \"\"\"Генерує детермінований ключ кешу на основі параметрів запиту.\"\"\"
    path = request.url.path
    query_params = str(sorted(request.query_params.items()))
    
    # Створюємо хеш від параметрів
    key_content = f"{func_name}:{path}:{query_params}"
    key_hash = hashlib.md5(key_content.encode()).hexdigest()
    
    return f"{prefix}:{key_hash}"
