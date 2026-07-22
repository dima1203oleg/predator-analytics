import asyncio
from app.services.adip.adip_core import adip_core
import logging
logging.basicConfig(level=logging.INFO)

async def test():
    result = await adip_core.process_new_source("https://jsonplaceholder.typicode.com/users")
    print(result)

if __name__ == "__main__":
    asyncio.run(test())
