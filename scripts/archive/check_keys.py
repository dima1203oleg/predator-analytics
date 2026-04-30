from __future__ import annotations

import asyncio
import logging

import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

async def check_gemini(key):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    payload = {
        "contents": [{"parts": [{"text": "Hello, are you alive?"}]}]
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{url}?key={key}", json=payload) as response:
                if response.status == 200:
                    return True, "OK"
                return False, f"Status {response.status}"
    except Exception as e:
        return False, str(e)

async def check_groq(key):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": "Hi"}]
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    return True, "OK"
                return False, f"Status {response.status}"
    except Exception as e:
        return False, str(e)

async def main():
    gemini_keys = [
        "AIzaSyDtHt-hJLkqVtdZHS7vu1M2sKjlZ77cEvM",
        "AIzaSyDF7WPENGOxFuXzQ_ZhxCrwrtX5pD0sw80",
        "AIzaSyB_lc_BH8a3X5jfKqsQgFuiXOHRIvJXhzQ",
        "AIzaSyCjFWH9es3em3IL_dexvLzbz7YfwxygIBk",
        "AIzaSyAk3BJhoy-RaVYkaCKXh7aBARofpwTmpEc",
        "AIzaSyAg4xWmHdBa-NYDigIcv2HhGEWsPi8W5-M"
    ]

    groq_keys = [
        "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",
        "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",
        "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",
        "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"
    ]

    working_gemini = []
    for key in gemini_keys:
        success, msg = await check_gemini(key)
        if success: working_gemini.append(key)

    working_groq = []
    for key in groq_keys:
        success, _msg = await check_groq(key)
        if success: working_groq.append(key)


if __name__ == "__main__":
    asyncio.run(main())
