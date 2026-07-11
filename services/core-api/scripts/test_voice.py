import asyncio
import httpx
import logging
from app.core.security import create_access_token

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

API_URL = "http://localhost:8000/api/v1/voice"

def get_token():
    return create_access_token(
        data={"sub": "test-user", "tenant_id": "test-tenant", "role": "admin"}
    )

async def test_voice():
    logger.info("Starting Voice (TTS + STT) test...")
    token = get_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": "test-tenant"
    }

    # 1. Test TTS (Synthesize)
    test_text = "Привіт! Це перевірка голосового модуля Предатор Аналітікс."
    logger.info(f"Generating TTS for text: '{test_text}'")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{API_URL}/synthesize",
            headers=headers,
            json={"text": test_text}
        )
        if resp.status_code != 200:
            logger.error(f"TTS Synthesis failed: {resp.status_code} {resp.text}")
            return
            
        audio_data = resp.content
        logger.info(f"✅ Synthesized successfully: {len(audio_data)} bytes of WAV audio")
        
        # Save to file for debugging
        with open("/tmp/test_output.wav", "wb") as f:
            f.write(audio_data)

    # 2. Test STT (Transcribe)
    logger.info("Transcribing the generated audio using STT...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        files = {"file": ("test_output.wav", audio_data, "audio/wav")}
        resp = await client.post(
            f"{API_URL}/transcribe",
            headers=headers,
            files=files
        )
        if resp.status_code != 200:
            logger.error(f"STT Transcription failed: {resp.status_code} {resp.text}")
            return
            
        result = resp.json()
        logger.info(f"✅ Transcribed text: '{result.get('text')}'")
        
        logger.info("Voice module tests completed successfully.")

if __name__ == "__main__":
    asyncio.run(test_voice())
