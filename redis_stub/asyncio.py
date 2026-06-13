class _FakeAsyncRedis:
    async def get(self, key: str):
        return None

    async def setex(self, key: str, ttl: int, value: str):
        return None

    async def close(self):
        return None

def from_url(url: str, *args, **kwargs) -> _FakeAsyncRedis:
    return _FakeAsyncRedis()
