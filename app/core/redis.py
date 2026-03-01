import redis.asyncio as redis

from app.libs.core.config import settings


class RedisClient:
    def __init__(self):
        self.client = None

    async def connect(self):
        if not self.client:
            self.client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
            print("✅ Redis Connected")

    async def get_client(self):
        if not self.client:
            await self.connect()
        return self.client

    async def close(self):
        if self.client:
            await self.client.close()


redis_client = RedisClient()
