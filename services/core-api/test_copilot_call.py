import asyncio
import httpx
import sys

async def test_copilot():
    url = "http://localhost:8000/api/v1/copilot/chat"
    payload = {
        "message": "Привіт! Що ти знаєш про нові завантажені дані митниці з реєстру або про налаштування DeepSeek?",
        "context": {"entity_filter": "deepseek-data"},
        "history": []
    }
    headers = {"Authorization": "Bearer MOCK_TOKEN", "X-Tenant-ID": "test"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers, timeout=10)
            if resp.status_code == 200:
                print("SUCCESS")
                print("Response:", resp.json())
            else:
                print(f"FAILED: {resp.status_code}")
                print(resp.text)
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_copilot())
