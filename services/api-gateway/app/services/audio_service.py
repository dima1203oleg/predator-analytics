
import logging
import os
import httpx
from typing import Optional
from libs.core.config import settings

logger = logging.getLogger(__name__)

class AudioService:
    """
    Service for Speech-to-Text (STT) and Text-to-Speech (TTS).
    Uses Google Cloud APIs or fallback local logic.
    """

    def __init__(self):
        self.api_key = settings.GOOGLE_TTS_API_KEY or os.getenv("GOOGLE_STT_API_KEY")
        self.tts_url = "https://texttospeech.googleapis.com/v1/text:synthesize"
        self.stt_url = "https://speech.googleapis.com/v1/speech:recognize"

    async def text_to_speech(self, text: str) -> Optional[bytes]:
        """Convert text to Ukrainian speech (MP3)"""
        if not self.api_key:
            logger.warning("Google TTS API key missing. Skipping TTS.")
            return None

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                payload = {
                    "input": {"text": text},
                    "voice": {"languageCode": "uk-UA", "name": "uk-UA-Wavenet-A"},
                    "audioConfig": {"audioEncoding": "MP3"}
                }
                response = await client.post(f"{self.tts_url}?key={self.api_key}", json=payload)
                if response.status_code == 200:
                    import base64
                    audio_content = response.json().get("audioContent")
                    return base64.b64decode(audio_content)
                else:
                    logger.error(f"TTS failed: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"TTS Error: {e}")
            return None

    async def speech_to_text(self, audio_content: bytes) -> Optional[str]:
        """Convert speech audio to Ukrainian text"""
        if not self.api_key:
            logger.warning("Google STT API key missing. Skipping STT.")
            return None

        try:
            import base64
            audio_b64 = base64.b64encode(audio_content).decode("utf-8")
            async with httpx.AsyncClient(timeout=10) as client:
                payload = {
                    "config": {
                        "encoding": "OGG_OPUS",
                        "sampleRateHertz": 16000,
                        "languageCode": "uk-UA",
                        "enableAutomaticPunctuation": True
                    },
                    "audio": {"content": audio_b64}
                }
                response = await client.post(f"{self.stt_url}?key={self.api_key}", json=payload)
                if response.status_code == 200:
                    results = response.json().get("results", [])
                    if results:
                        return results[0].get("alternatives", [{}])[0].get("transcript")
                else:
                    logger.error(f"STT failed: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"STT Error: {e}")
            return None

audio_service = AudioService()
