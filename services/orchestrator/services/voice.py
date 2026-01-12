"""
VoiceProcessor v25.0
Handles STT (Speech-to-Text) and TTS (Text-to-Speech) with Smart Fallback.
"""
import logging
from typing import Optional
from ..agents.voice_handler import VoiceHandler

logger = logging.getLogger("voice_processor")

class VoiceProcessor:
    def __init__(self):
        self.handler = VoiceHandler()
        self._initialized = False

    async def initialize(self):
        if not self._initialized:
            await self.handler.initialize()
            self._initialized = True

    async def transcribe(self, file_path: str, fallback: str = "whisper") -> str:
        """Voice -> Text (STT) with Smart Fallback"""
        await self.initialize()

        # 1. Primary: Google Cloud STT
        text = await self.handler.speech_to_text(file_path)

        # 2. Fallback: local Whisper (simulated or via simple STT)
        if not text:
            logger.warning(f"Google STT failed, using fallback: {fallback}")
            from ..agents.voice_handler import SimpleTTSSTT
            simple_handler = SimpleTTSSTT()
            await simple_handler.initialize()
            text = await simple_handler.speech_to_text(file_path)

        return text or "Помилка розпізнавання: тиша або перешкоди."

    async def speak(self, text: str) -> Optional[bytes]:
        """Text -> Voice (TTS)"""
        await self.initialize()
        # High quality Neural2-A (already set in voice_handler earlier)
        return await self.handler.text_to_speech(text)

    def is_available(self) -> bool:
        return self.handler.is_available()
