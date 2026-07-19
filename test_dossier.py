import asyncio
import httpx
import json

async def test_compile():
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                "http://localhost:8000/api/v1/dossier/compile",
                json={
                    "entity_type": "person",
                    "identifier": "Кізима Дмитро Миколайович",
                    "name": "Кізима Дмитро Миколайович",
                    "classification_levels": ["WHITE", "GREY", "BLACK"]
                }
            )
            print("Status:", resp.status_code)
            print("Response:", json.dumps(resp.json(), indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_compile())
