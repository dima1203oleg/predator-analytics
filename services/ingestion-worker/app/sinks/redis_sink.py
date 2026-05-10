"""Redis Sink — PREDATOR Analytics v61.0-ELITE Ironclad.

Короткостроковий кеш, черги, сесії (HR: Cache).
"""

from __future__ import annotations

import json
import os
from typing import Any

from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.redis")


class RedisSink:
    """Сінк для кешування гарячих даних у Redis."""

    DEFAULT_TTL = 300  # 5 хвилин

    def __init__(self) -> None:
        self.url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._client: Any = None
        self._connected = False

    def _get_client(self) -> Any:
        if self._client is None:
            try:
                import redis.asyncio as aioredis

                self._client = aioredis.from_url(
                    self.url,
                    encoding="utf-8",
                    decode_responses=True,
                )
                self._connected = True
                logger.info(f"Redis connected: {self.url}")
            except ImportError:
                logger.warning("redis-py not installed, cache disabled")
                return None
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}")
                return None
        return self._client

    async def cache_declaration(
        self, declaration_number: str, data: dict[str, Any], ttl: int | None = None
    ) -> None:
        """Кешує декларацію за номером."""
        client = self._get_client()
        if not client:
            return
        key = f"decl:{declaration_number}"
        try:
            await client.setex(
                key,
                ttl or self.DEFAULT_TTL,
                json.dumps(data, ensure_ascii=False, default=str),
            )
        except Exception as e:
            logger.error(f"Redis cache set failed: {e}")

    async def cache_company_top_declarations(
        self, ueid: str, declarations: list[dict[str, Any]], ttl: int | None = None
    ) -> None:
        """Кешує топ-декларації компанії."""
        client = self._get_client()
        if not client:
            return
        key = f"company:{ueid}:top_decls"
        try:
            await client.setex(
                key,
                ttl or self.DEFAULT_TTL,
                json.dumps(declarations, ensure_ascii=False, default=str),
            )
        except Exception as e:
            logger.error(f"Redis cache set failed: {e}")

    async def get_cached(self, key: str) -> dict[str, Any] | None:
        """Отримує значення з кешу."""
        client = self._get_client()
        if not client:
            return None
        try:
            value = await client.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.error(f"Redis cache get failed: {e}")
            return None

    async def invalidate_company_cache(self, ueid: str) -> None:
        """Інвалідує кеш компанії."""
        client = self._get_client()
        if not client:
            return
        try:
            await client.delete(f"company:{ueid}:top_decls")
        except Exception as e:
            logger.error(f"Redis invalidate failed: {e}")

    async def publish_ingestion_event(
        self, channel: str, event: dict[str, Any]
    ) -> None:
        """Публікує подію інгестії в Redis Pub/Sub."""
        client = self._get_client()
        if not client:
            return
        try:
            await client.publish(
                channel,
                json.dumps(event, ensure_ascii=False, default=str),
            )
        except Exception as e:
            logger.error(f"Redis publish failed: {e}")

    async def close(self) -> None:
        if self._client:
            await self._client.close()
            self._client = None
