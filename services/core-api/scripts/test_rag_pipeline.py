import asyncio
import httpx
import logging
import json
from app.core.security import create_access_token

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

API_URL = "http://localhost:8000/api/v1"

TENANT_ID = "a0000000-0000-0000-0000-000000000001"
USER_ID = "b0000000-0000-0000-0000-000000000001"

def get_token():
    return create_access_token(
        data={"sub": USER_ID, "tenant_id": TENANT_ID, "role": "vip"}
    )

async def test_rag():
    logger.info("Starting RAG AI Copilot test...")
    token = get_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": TENANT_ID,
        "Content-Type": "application/json"
    }

    payload = {
        "message": "Що відомо про компанію Test Importer LLC? Які товари вона імпортує згідно з деклараціями?",
        "model": "qwen3:latest-optimized"
    }

    logger.info(f"Sending query: {payload['message']}")

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{API_URL}/copilot/chat",
            headers=headers,
            json=payload
        )

        if response.status_code == 200:
            data = response.json()
            logger.info("✅ Success! RAG Pipeline works.")
            logger.info(f"Reply: {data.get('reply')}")
            logger.info(f"Sources used: {json.dumps(data.get('sources'), indent=2, ensure_ascii=False)}")
        else:
            logger.error(f"❌ Failed. Status: {response.status_code}, Detail: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_rag())
