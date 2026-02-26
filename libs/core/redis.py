import redis.asyncio as aioredis
from .config import settings

# Global redis client for core libs
redis_client = aioredis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
    socket_timeout=5,
    socket_connect_timeout=5
)
