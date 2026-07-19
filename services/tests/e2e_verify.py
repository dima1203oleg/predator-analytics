import asyncio
import httpx
import logging
import websockets
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("e2e_verifier")

API_URL = "http://194.177.1.200:8000/api/v1"
WS_URL = "ws://194.177.1.200:8000/api/v1/pae/stream"

async def get_token():
    async with httpx.AsyncClient() as client:
        # Register if needed
        try:
            await client.post(f"{API_URL}/auth/register?email=test@test.com&password=testpass&role=admin")
        except Exception:
            pass
        
        # Login
        resp = await client.post(f"{API_URL}/auth/token", data={"username": "test@test.com", "password": "testpass"})
        if resp.status_code == 200:
            return resp.json()["access_token"]
        return None

async def test_pae_persona(token: str):
    logger.info("Testing PAE Persona Extraction for Кізима Дмитро Миколайович...")
    try:
        # Pass token in headers for websocket
        headers = {"Authorization": f"Bearer {token}"}
        # handle different websockets library versions
        kwargs = {"additional_headers": headers} if hasattr(websockets, "version") else {"extra_headers": headers}
        async with websockets.connect(WS_URL, **kwargs) as websocket:
            intent = {
                "query": "Знайти всі зв'язки для особи: Кізима Дмитро Миколайович",
                "type": "PersonaExtraction",
                "filters": {"dob": "12.03.1985"}
            }
            await websocket.send(json.dumps(intent))
            
            # 1. Pulse msg
            pulse = await websocket.recv()
            logger.info(f"Received pulse: {pulse}")
            
            # 2. Synthesis msg
            synthesis = await websocket.recv()
            logger.info(f"Received synthesis: {synthesis}")
            
            data = json.loads(synthesis)
            
            if "Кізима Дмитро Миколайович" in str(data):
                logger.info("✅ PAE Target Persona Extraction OK.")
            else:
                logger.error("❌ PAE Data not found for persona.")
    except Exception as e:
        logger.error(f"❌ PAE Test Failed: {e}")

async def test_voice_synthesis(token: str):
    logger.info("Testing TTS (Voice Synthesis)...")
    async with httpx.AsyncClient() as client:
        try:
            headers = {"Authorization": f"Bearer {token}"}
            resp = await client.post(f"{API_URL}/voice/synthesize", json={"text": "Вітаю, пане Дмитро. Я готова до роботи."}, headers=headers)
            if resp.status_code == 200 and resp.headers.get("content-type") == "audio/wav":
                logger.info("✅ TTS Synthesis OK.")
            else:
                logger.error(f"❌ TTS Failed: {resp.status_code}")
        except Exception as e:
            logger.error(f"❌ TTS Connection Failed (is piper running?): {e}")

async def run_all():
    token = "test-token"
    await test_pae_persona(token)
    await test_voice_synthesis(token)

if __name__ == "__main__":
    asyncio.run(run_all())
