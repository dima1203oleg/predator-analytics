"""TUS Protocol Service — PREDATOR Analytics v61.0-ELITE.

Сервіс для реалізації завантаження файлів частинами (Resumable Uploads)
згідно з протоколом TUS, використовуючи Redis для збереження метаданих.
"""
from typing import Optional
from app.services.valkey_service import get_valkey_service
from predator_common.logging import get_logger

logger = get_logger("core_api.tus_service")


class TusService:
    """Сервіс для TUS Protocol (Resumable Uploads)."""

    def __init__(self):
        """Ініціалізація сервісу."""
        self.redis = get_valkey_service()
        self.prefix = "tus:upload:"
        # TTL сесії завантаження (наприклад, 24 години)
        self.ttl = 86400

    async def create_upload(self, file_id: str, upload_length: int, metadata: dict) -> None:
        """Створює нову сесію TUS завантаження."""
        key_length = f"{self.prefix}{file_id}:length"
        key_offset = f"{self.prefix}{file_id}:offset"
        key_meta = f"{self.prefix}{file_id}:meta"

        await self.redis.set(key_length, str(upload_length), expire=self.ttl)
        await self.redis.set(key_offset, "0", expire=self.ttl)

        import json
        await self.redis.set(key_meta, json.dumps(metadata), expire=self.ttl)
        logger.info(f"TUS session created: {file_id} ({upload_length} bytes)")

    async def get_offset(self, file_id: str) -> Optional[int]:
        """Повертає поточний offset (Upload-Offset)."""
        key_offset = f"{self.prefix}{file_id}:offset"
        val = await self.redis.get(key_offset)
        return int(val) if val is not None else None

    async def get_length(self, file_id: str) -> Optional[int]:
        """Повертає загальну довжину файлу (Upload-Length)."""
        key_length = f"{self.prefix}{file_id}:length"
        val = await self.redis.get(key_length)
        return int(val) if val is not None else None

    async def get_metadata(self, file_id: str) -> Optional[dict]:
        """Повертає метадані файлу."""
        key_meta = f"{self.prefix}{file_id}:meta"
        val = await self.redis.get(key_meta)
        if val:
            import json
            return json.loads(val)
        return None

    async def update_offset(self, file_id: str, new_offset: int) -> None:
        """Оновлює offset після успішного запису chunk'у."""
        key_offset = f"{self.prefix}{file_id}:offset"
        await self.redis.set(key_offset, str(new_offset), expire=self.ttl)
        # Оновлюємо TTL для всієї сесії
        key_length = f"{self.prefix}{file_id}:length"
        key_meta = f"{self.prefix}{file_id}:meta"
        await self.redis.client.expire(key_length, self.ttl)
        await self.redis.client.expire(key_meta, self.ttl)

    async def delete_upload(self, file_id: str) -> None:
        """Видаляє сесію після успішного завантаження або скасування."""
        key_length = f"{self.prefix}{file_id}:length"
        key_offset = f"{self.prefix}{file_id}:offset"
        key_meta = f"{self.prefix}{file_id}:meta"
        await self.redis.client.delete(key_length, key_offset, key_meta)


_tus_service: TusService | None = None

def get_tus_service() -> TusService:
    """Отримати singleton інстанс TusService."""
    global _tus_service
    if _tus_service is None:
        _tus_service = TusService()
    return _tus_service
