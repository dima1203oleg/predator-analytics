import httpx
import asyncio

class AutogenApiClient:
    def __init__(self, base_url: str):
        self.base_url = base_url

    async def fetch_data(self) -> list:
        async with httpx.AsyncClient() as client:
            res = await client.get(self.base_url)
            res.raise_for_status()
            return res.json()

def normalize_payload(raw_data: list) -> list:
    return [{'id': item.get('id'), 'name': item.get('name'), 'email': item.get('email')} for item in raw_data]
