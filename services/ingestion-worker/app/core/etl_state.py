"""ETL State Management — Управління станом синхронізації.

Зберігає офсети (offsets), мітки часу (timestamps) та інші 
дані стану конвеєрів для забезпечення ідемпотентності та відновлення після збоїв.
"""

import redis.asyncio as redis
import orjson
from typing import Any, Dict, Optional

from app.config import get_settings


class ETLStateManager:
    """Менеджер стану ETL-конвеєрів. Забезпечує ідемпотентність через Redis."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.redis = redis.from_url(self.settings.REDIS_URL, decode_responses=True)
        self.prefix = "etl:state:"

    async def get_state(self, pipeline_id: str, default: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Отримує поточний стан пайплайну."""
        data = await self.redis.get(f"{self.prefix}{pipeline_id}")
        if data:
            return orjson.loads(data)
        return default or {}

    async def save_state(self, pipeline_id: str, state: Dict[str, Any]) -> None:
        """Зберігає стан пайплайну."""
        await self.redis.set(
            f"{self.prefix}{pipeline_id}", 
            orjson.dumps(state).decode("utf-8")
        )
