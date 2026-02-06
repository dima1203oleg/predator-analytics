from __future__ import annotations

import asyncio
import os

from dotenv import load_dotenv
import httpx


load_dotenv()

async def check_key(key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": "hi"}]}]
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(url, json=payload)
        print(f"Key: {key[:10]}... Status: {r.status_code}")
        if r.status_code != 200:
            print(f"Error: {r.text}")
        else:
            print("Success!")

# Try the single key
single_key = os.getenv("GEMINI_API_KEY")
if single_key:
    asyncio.run(check_key(single_key))

# Try one from the list
keys_str = os.getenv("GEMINI_API_KEYS", "")
if keys_str:
    import json
    try:
        keys = json.loads(keys_str)
        if keys:
            asyncio.run(check_key(keys[0]))
    except:
        pass
