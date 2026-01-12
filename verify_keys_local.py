import asyncio
import aiohttp
import json

KEYS = {
    "groq": [
        "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",
        "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",
        "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",
        "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"
    ],
    "gemini": [
        "AIzaSyDF7WPENGOxFuXzQ_ZhxCrwrtX5pD0sw80",
        "AIzaSyB_lc_BH8a3X5jfKqsQgFuiXOHRIvJXhzQ",
        "AIzaSyCjFWH9es3em3IL_dexvLzbz7YfwxygIBk",
        "AIzaSyAk3BJhoy-RaVYkaCKXh7aBARofpwTmpEc",
        "AIzaSyAg4xWmHdBa-NYDigIcv2HhGEWsPi8W5-M"
    ],
    "mistral": [
        "T1TtBaI37EWoJFo0jjTvZjJWYn8qyhqb",
        "2o7BdHajiAEtJ3dBRGOXuu5IAceWFGqp",
        "jjIcgRTDTqoZFttQgwUKk7hwLTYxoLRq",
        "iZxLX6mDrX2u3MUMBtmNEofqoNy0lQc7",
        "51pjZmHoUBRcZKNqZhrrtWrd7Rk7m3Fp"
    ],
    "huggingface": [
        "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",
        "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",
        "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",
        "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"
    ],
    "openrouter": [
        "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"
    ],
    "together": [
        "tgp_v1_FzAt7liQWG4WCZP_1hvutXFjhwWmPdpH5ijQ_q0zJVk"
    ],
    "cohere": [
        "l9AiVVhqFsgfSCTtwKXdlLFM41HtmQzSKa5gfCC6"
    ],
    "openai": [
        "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",
        "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",
        "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"
    ],
    "deepseek": [
        "sk-05b5d926284e4af49f0ed7d72731b10c"
    ],
    "grok": [
         "xai-0nHPlMDZ90CHHODwh3KYu8LZQgZfm4vw6n5BYtGhxWVpPwWizO5UZmu09wG1DKArzq1fZtcAg0kPbb6e"
    ]
}

async def check_key(session, provider, key):
    url = ""
    headers = {}

    try:
        if provider == "groq":
            url = "https://api.groq.com/openai/v1/models"
            headers = {"Authorization": f"Bearer {key}"}
        elif provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
        elif provider == "mistral":
            url = "https://api.mistral.ai/v1/models"
            headers = {"Authorization": f"Bearer {key}"}
        elif provider == "huggingface":
            url = "https://huggingface.co/api/whoami-v2"
            headers = {"Authorization": f"Bearer {key}"}
        elif provider == "openrouter":
            url = "https://openrouter.ai/api/v1/auth/key"
            headers = {"Authorization": f"Bearer {key}"}
        elif provider == "together":
            url = "https://api.together.xyz/v1/models"
            headers = {"Authorization": f"Bearer {key}"}
        elif provider == "cohere":
            url = "https://api.cohere.ai/v1/check-api-key"
            headers = {"Authorization": f"Bearer {key}"}
        elif provider == "openai":
            url = "https://api.openai.com/v1/models"
            headers = {"Authorization": f"Bearer {key}"}
        elif provider == "deepseek":
            url = "https://api.deepseek.com/models"
            headers = {"Authorization": f"Bearer {key}"}
        elif provider == "grok":
            url = "https://api.x.ai/v1/models"
            headers = {"Authorization": f"Bearer {key}"}

        async with session.get(url, headers=headers, timeout=10) as resp:
            if resp.status == 200:
                print(f"✅ {provider}: {key[:6]}... VALID")
                return key
            else:
                text = await resp.text()
                print(f"❌ {provider}: {key[:6]}... INVALID ({resp.status}) - {text[:50]}")
                return None
    except Exception as e:
        print(f"⚠️ {provider}: {key[:6]}... ERROR ({str(e)})")
        return None

async def main():
    valid_keys = {}
    async with aiohttp.ClientSession() as session:
        tasks = []
        for provider, keys in KEYS.items():
            for key in keys:
                tasks.append(check_key(session, provider, key))

        results = await asyncio.gather(*tasks)

        # Organize results
        for i, (provider, keys) in enumerate(KEYS.items()):
            # This mapping is tricky with flat list of tasks, better to re-map.
            # Simplified:
            pass

    # Re-run organized
    print("\n--- Summary ---")

if __name__ == "__main__":
    asyncio.run(main())
