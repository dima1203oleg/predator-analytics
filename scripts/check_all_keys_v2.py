from __future__ import annotations

import asyncio
import logging

import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

async def check_gemini(key):
    # Try gemini-pro as it's the stable one usually
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    payload = {"contents": [{"parts": [{"text": "Hi"}]}]}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{url}?key={key}", json=payload) as response:
                if response.status == 200: return True, "OK"
                # If 404, maybe models are different for this key, try flash
                if response.status == 404:
                    url_flash = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
                    async with session.post(f"{url_flash}?key={key}", json=payload) as resp_flash:
                        if resp_flash.status == 200: return True, "OK (Flash)"
                        return False, "404 (Pro & Flash failed)"
                return False, f"Status {response.status}"
    except Exception as e: return False, str(e)

async def check_groq(key):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": "Hi"}]}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200: return True, "OK"
                return False, f"Status {response.status}"
    except Exception as e: return False, str(e)

async def check_openai_c(key, base_url="https://api.openai.com/v1/chat/completions", model="gpt-4o-mini"):
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": [{"role": "user", "content": "Hi"}]}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(base_url, headers=headers, json=payload) as response:
                if response.status == 200: return True, "OK"
                return False, f"Status {response.status}"
    except Exception as e: return False, str(e)

async def main():
    keys = {
        "gemini": [
            "AIzaSyDtHt-hJLkqVtdZHS7vu1M2sKjlZ77cEvM", # Previously failed, but let's recheck properly
            "AIzaSyDF7WPENGOxFuXzQ_ZhxCrwrtX5pD0sw80",
            "AIzaSyB_lc_BH8a3X5jfKqsQgFuiXOHRIvJXhzQ",
            "AIzaSyCjFWH9es3em3IL_dexvLzbz7YfwxygIBk",
            "AIzaSyAk3BJhoy-RaVYkaCKXh7aBARofpwTmpEc",
            "AIzaSyAg4xWmHdBa-NYDigIcv2HhGEWsPi8W5-M",
            "AIzaSyBSg76crDWrn_ZMd7G5p10qJ1KVy7IaD3A"
        ],
        "groq": [
            "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",
            "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",
            "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",
            "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",
            "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",
            "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"
        ],
        "mistral": [
            "T1TtBaI37EWoJFo0jjTvZjJWYn8qyhqb",
            "2o7BdHajiAEtJ3dBRGOXuu5IAceWFGqp",
            "jjIcgRTDTqoZFttQgwUKk7hwLTYxoLRq",
            "iZxLX6mDrX2u3MUMBtmNEofqoNy0lQc7"
        ],
        "deepseek": [
            "sk-c5009c642d0a43d7988aeae76c891011",
            "sk-05b5d926284e4af49f0ed7d72731b10c"
        ],
        "openai": [
            "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",
            "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",
            "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"
        ],
        "openrouter": ["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"],
        "cohere": ["l9AiVVhqFsgfSCTtwKXdlLFM41HtmQzSKa5gfCC6"],
        "together": ["tgp_v1_FzAt7liQWG4WCZP_1hvutXFjhwWmPdpH5ijQ_q0zJVk"],
        "xai": ["xai-0nHPlMDZ90CHHODwh3KYu8LZQgZfm4vw6n5BYtGhxWVpPwWizO5UZmu09wG1DKArzq1fZtcAg0kPbb6e"]
    }

    results = {}


    # Gemini
    results['gemini'] = []
    for k in keys['gemini']:
        s, m = await check_gemini(k)
        if s: results['gemini'].append(k)

    # Groq
    results['groq'] = []
    for k in keys['groq']:
        s, m = await check_groq(k)
        if s: results['groq'].append(k)

    # Mistral
    results['mistral'] = []
    for k in keys['mistral']:
        s, m = await check_openai_c(k, "https://api.mistral.ai/v1/chat/completions", "mistral-tiny")
        if s: results['mistral'].append(k)

    # DeepSeek
    results['deepseek'] = []
    for k in keys['deepseek']:
        s, m = await check_openai_c(k, "https://api.deepseek.com/v1/chat/completions", "deepseek-chat")
        if s: results['deepseek'].append(k)

    # OpenAI
    results['openai'] = []
    for k in keys['openai']:
        s, m = await check_openai_c(k, "https://api.openai.com/v1/chat/completions", "gpt-3.5-turbo")
        if s: results['openai'].append(k)

    # xAI
    results['xai'] = []
    for k in keys['xai']:
        s, _m = await check_openai_c(k, "https://api.x.ai/v1/chat/completions", "grok-beta")
        if s: results['xai'].append(k)


if __name__ == "__main__":
    asyncio.run(main())
