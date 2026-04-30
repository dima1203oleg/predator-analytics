from __future__ import annotations

import asyncio

from app.core.llm_keys_storage import llm_keys_storage


async def add_mistral():
    key = "wAp8islIU7ZK24G7cRDrfttvYBIfMKKc"
    success = await llm_keys_storage.add_llm_key("mistral", key)
    if success:
        pass
    else:
        pass

if __name__ == "__main__":
    asyncio.run(add_mistral())
