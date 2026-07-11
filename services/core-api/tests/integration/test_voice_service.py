import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.services.speech import stt_service, tts_service

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_voice_service():
    """Initialize the voice service for testing."""
    async def init():
        await stt_service.initialize()
        await tts_service.initialize()
    asyncio.run(init())
    yield

def _generate_empty_wav():
    import io, wave
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(16000)
        wav_file.writeframes(b"\x00\x00" * 16000)
    return buffer.getvalue()

def test_transcribe_endpoint():
    """Test STT endpoint with empty wav"""
    empty_wav = _generate_empty_wav()
    
    response = client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("test.wav", empty_wav, "audio/wav")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "text" in data
    # The text might be empty for an empty wav or contain mock message
    assert isinstance(data["text"], str)

def test_synthesize_endpoint():
    """Test the synthesize endpoint with some text."""
    response = client.post(
        "/api/v1/voice/synthesize",
        json={"text": "Привіт, як справи?"}
    )
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    assert len(response.content) > 0
