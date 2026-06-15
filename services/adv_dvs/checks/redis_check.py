"""ADV DVS: Redis Connection Check."""
import os
import asyncio
from predator_common.logging import get_logger

logger = get_logger("adv_dvs.checks.redis")

async def check_redis() -> dict:
    """Перевіряє з'єднання з Redis."""
    try:
        import redis.asyncio as redis
    except ImportError:
        return {"status": "fail", "component": "redis", "message": "redis is not installed"}

    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    logger.info("Перевірка підключення до Redis")
    
    try:
        client = redis.from_url(redis_url, socket_timeout=5.0)
        await client.ping()
        await client.aclose()
        return {"status": "passed", "component": "redis", "message": "Підключення успішне."}
    except Exception as e:
        logger.error(f"Помилка Redis: {e}")
        return {"status": "fail", "component": "redis", "message": str(e)}
