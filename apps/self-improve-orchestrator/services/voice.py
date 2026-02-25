import logging

logger = logging.getLogger("predator_voice")

class VoiceProcessor:
    def __init__(self):
        pass

    async def speak(self, text: str):
        """Mock TTS: In a real system, would call Google TTS/ElevenLabs"""
        logger.info(f"TTS Mock: Speaking '{text}'")
        # Return none to trigger text-only fallback in bot.py
        return None

    async def transcribe(self, audio_file_path: str):
        """Mock STT: In a real system, would call Whisper/Google STT"""
        logger.info(f"STT Mock: Transcribing {audio_file_path}")
        return "Тестова розшифровка голосового повідомлення"
