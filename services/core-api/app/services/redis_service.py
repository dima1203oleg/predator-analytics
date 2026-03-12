"""Redis Service — PREDATOR Analytics v55.2-SM-EXTENDED.

Кешування та збереження сесій.
Реалізація згідно TZ §2.6.
"""
from datetime import UTC, datetime
import json
from typing import Any

import redis.asyncio as redis

from app.config import get_settings
from predator_common.logging import get_logger

logger = get_logger("redis_service")
settings = get_settings()


class RedisService:
    """Сервіс для роботи з Redis.

    Використовується для:
    - Кешування API відповідей
    - Збереження copilot сесій
    - Rate limiting
    - Pub/Sub для real-time подій
    """

    def __init__(self) -> None:
        self._client: redis.Redis | None = None
        self._connected = False

    async def connect(self) -> bool:
        """Підключення до Redis."""
        if self._connected and self._client:
            return True

        try:
            self._client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
            # Перевірка з'єднання
            await self._client.ping()
            self._connected = True
            logger.info("Redis підключено", extra={"url": settings.REDIS_URL})
            return True

        except Exception as e:
            logger.warning(f"Redis недоступний: {e}")
            self._connected = False
            return False

    async def disconnect(self):
        """Відключення від Redis."""
        if self._client:
            await self._client.close()
            self._client = None
            self._connected = False
            logger.info("Redis відключено")

    async def get(self, key: str) -> str | None:
        """Отримати значення за ключем."""
        if not self._connected or not self._client:
            return None
        try:
            return await self._client.get(key)
        except Exception as e:
            logger.error(f"Redis GET помилка: {e}")
            return None

    async def set(
        self,
        key: str,
        value: str,
        expire_seconds: int | None = None,
    ) -> bool:
        """Зберегти значення."""
        if not self._connected or not self._client:
            return False
        try:
            await self._client.set(key, value, ex=expire_seconds)
            return True
        except Exception as e:
            logger.error(f"Redis SET помилка: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Видалити ключ."""
        if not self._connected or not self._client:
            return False
        try:
            await self._client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE помилка: {e}")
            return False

    async def get_json(self, key: str) -> dict | list | None:
        """Отримати JSON значення."""
        value = await self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return None
        return None

    async def set_json(
        self,
        key: str,
        value: dict | list,
        expire_seconds: int | None = None,
    ) -> bool:
        """Зберегти JSON значення."""
        try:
            json_str = json.dumps(value, default=str, ensure_ascii=False)
            return await self.set(key, json_str, expire_seconds)
        except Exception as e:
            logger.error(f"Redis SET JSON помилка: {e}")
            return False

    # ======================== COPILOT SESSIONS ========================

    def _session_key(self, session_id: str) -> str:
        """Генерує ключ для сесії."""
        return f"copilot:session:{session_id}"

    def _session_messages_key(self, session_id: str) -> str:
        """Генерує ключ для повідомлень сесії."""
        return f"copilot:messages:{session_id}"

    async def create_session(
        self,
        session_id: str,
        user_id: str,
        tenant_id: str,
        context: dict | None = None,
    ) -> bool:
        """Створює нову copilot сесію."""
        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "tenant_id": tenant_id,
            "context": context or {},
            "created_at": datetime.now(UTC).isoformat(),
            "updated_at": datetime.now(UTC).isoformat(),
            "message_count": 0,
        }
        # Сесія живе 24 години
        return await self.set_json(
            self._session_key(session_id),
            session_data,
            expire_seconds=86400,
        )

    async def get_session(self, session_id: str) -> dict | None:
        """Отримує дані сесії."""
        return await self.get_json(self._session_key(session_id))

    async def update_session(self, session_id: str, updates: dict) -> bool:
        """Оновлює дані сесії."""
        session = await self.get_session(session_id)
        if not session:
            return False

        session.update(updates)
        session["updated_at"] = datetime.now(UTC).isoformat()

        return await self.set_json(
            self._session_key(session_id),
            session,
            expire_seconds=86400,
        )

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        message_id: str | None = None,
    ) -> bool:
        """Додає повідомлення до сесії."""
        if not self._connected or not self._client:
            return False

        message = {
            "message_id": message_id or "",
            "role": role,
            "content": content,
            "timestamp": datetime.now(UTC).isoformat(),
        }

        try:
            # Додаємо в список повідомлень
            key = self._session_messages_key(session_id)
            await self._client.rpush(key, json.dumps(message, ensure_ascii=False))
            # Оновлюємо TTL
            await self._client.expire(key, 86400)

            # Оновлюємо лічильник в сесії
            session = await self.get_session(session_id)
            if session:
                session["message_count"] = session.get("message_count", 0) + 1
                await self.set_json(self._session_key(session_id), session, 86400)

            return True
        except Exception as e:
            logger.error(f"Redis ADD MESSAGE помилка: {e}")
            return False

    async def get_messages(
        self,
        session_id: str,
        limit: int = 50,
    ) -> list[dict]:
        """Отримує повідомлення сесії."""
        if not self._connected or not self._client:
            return []

        try:
            key = self._session_messages_key(session_id)
            # Отримуємо останні N повідомлень
            messages_raw = await self._client.lrange(key, -limit, -1)
            return [json.loads(m) for m in messages_raw]
        except Exception as e:
            logger.error(f"Redis GET MESSAGES помилка: {e}")
            return []

    async def delete_session(self, session_id: str) -> bool:
        """Видаляє сесію та всі повідомлення."""
        if not self._connected or not self._client:
            return False

        try:
            await self._client.delete(
                self._session_key(session_id),
                self._session_messages_key(session_id),
            )
            return True
        except Exception as e:
            logger.error(f"Redis DELETE SESSION помилка: {e}")
            return False

    # ======================== CACHING ========================

    async def cache_get(self, cache_key: str) -> Any | None:
        """Отримати закешоване значення."""
        return await self.get_json(f"cache:{cache_key}")

    async def cache_set(
        self,
        cache_key: str,
        value: Any,
        ttl_seconds: int = 300,
    ) -> bool:
        """Закешувати значення."""
        return await self.set_json(f"cache:{cache_key}", value, ttl_seconds)

    async def cache_invalidate(self, cache_key: str) -> bool:
        """Інвалідувати кеш."""
        return await self.delete(f"cache:{cache_key}")

    # ======================== RATE LIMITING ========================

    async def rate_limit_check(
        self,
        key: str,
        limit: int,
        window_seconds: int = 60,
    ) -> tuple[bool, int]:
        """Перевірка rate limit.

        Returns:
            Tuple[allowed, remaining]

        """
        if not self._connected or not self._client:
            return True, limit  # Дозволяємо якщо Redis недоступний

        try:
            rate_key = f"ratelimit:{key}"
            current = await self._client.incr(rate_key)

            if current == 1:
                await self._client.expire(rate_key, window_seconds)

            remaining = max(0, limit - current)
            allowed = current <= limit

            return allowed, remaining
        except Exception as e:
            logger.error(f"Redis RATE LIMIT помилка: {e}")
            return True, limit


# ======================== SINGLETON ========================

_redis_service: RedisService | None = None


def get_redis_service() -> RedisService:
    """Отримати singleton інстанс Redis сервісу."""
    global _redis_service
    if _redis_service is None:
        _redis_service = RedisService()
    return _redis_service


async def init_redis():
    """Ініціалізація Redis при старті застосунку."""
    service = get_redis_service()
    await service.connect()


async def close_redis():
    """Закриття Redis при зупинці застосунку."""
    global _redis_service
    if _redis_service:
        await _redis_service.disconnect()
        _redis_service = None
