from __future__ import annotations

import asyncio
import os

from dotenv import load_dotenv
import httpx

load_dotenv()

async def check_mistral():
    key = os.getenv("MISTRAL_API_KEY")
    if not key:
        return
    url = "https://api.mistral.ai/v1/chat/completions"
    payload = {
        "model": "mistral-tiny",
        "messages": [{"role": "user", "content": "hi"}]
    }
    headers = {"Authorization": f"Bearer {key}"}
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(url, headers=headers, json=payload, timeout=10)
            if r.status_code != 200:
                pass
        except Exception:
            pass

async def check_groq():
    key = os.getenv("GROQ_API_KEY")
    if not key:
        return
    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": "hi"}]
    }
    headers = {"Authorization": f"Bearer {key}"}
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(url, headers=headers, json=payload, timeout=10)
            if r.status_code != 200:
                pass
        except Exception:
            pass

async def main():
    await check_mistral()
    await check_groq()

if __name__ == "__main__":
    asyncio.run(main())
