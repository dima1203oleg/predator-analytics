"""
Redis Sentinel Infrastructure API (Phase 2E — SM Edition).

Endpoints for Redis Sentinel status and memory statistics.
"""
from fastapi import APIRouter
from typing import Any

from app.services.infrastructure.cache.redis_sentinel import RedisSentinelManager

router = APIRouter(prefix="/infra/cache/redis", tags=["Infrastructure & Cache"])

_mgr = RedisSentinelManager()


@router.get("/status")
async def get_redis_status() -> dict[str, Any]:
    """Стан Redis Sentinel."""
    return _mgr.get_sentinel_status()


@router.get("/memory")
async def get_redis_memory() -> dict[str, Any]:
    """Статистика пам'яті Redis."""
    return _mgr.get_memory_stats()
