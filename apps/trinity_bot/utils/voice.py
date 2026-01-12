import os
import logging
import speech_recognition as sr
from pydub import AudioSegment
import asyncio

# Check for whisper availability
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

logger = logging.getLogger("trinity.voice")

class VoiceEngine:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.whisper_model = None
        if WHISPER_AVAILABLE:
            # Load small model for reasonable speed/accuracy tradeoff
            # Check if we should load lazily or now. Loading now for 'bot ready' status.
            pass

    async def transcribe_google(self, file_path: str, lang="uk-UA") -> str:
        """Transcribe audio using Google Speech Recognition."""
        wav_path = self._convert_to_wav(file_path)

        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._recognize_google_sync, wav_path, lang)

    def _recognize_google_sync(self, wav_path, lang):
        with sr.AudioFile(wav_path) as source:
            audio_data = self.recognizer.record(source)
            try:
                # Use default key or env var if provided (speech_recognition uses a default test key often)
                return self.recognizer.recognize_google(audio_data, language=lang)
            except sr.UnknownValueError:
                return "???"
            except sr.RequestError as e:
                raise Exception(f"Google Speech API error: {e}")

    async def transcribe_whisper(self, file_path: str) -> str:
        """Transcribe using local Whisper model."""
        if not WHISPER_AVAILABLE:
            return "Whisper model not available."

        if not self.whisper_model:
             # Lazy load
             import whisper
             self.whisper_model = whisper.load_model("base")

        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, self.whisper_model.transcribe, file_path)
        return result.get("text", "")

    def _convert_to_wav(self, file_path: str) -> str:
        """Convert OGG/MP3 to WAV for processing."""
        path, ext = os.path.splitext(file_path)
        if ext == ".wav":
             return file_path

        wav_path = f"{path}.wav"
        audio = AudioSegment.from_file(file_path)
        audio.export(wav_path, format="wav")
        return wav_path

    async def synthesize(self, text: str, lang='uk'):
        """Mock Text-to-Speech synthesis."""
        # return path to audio file
        # In a real app we'd use gTTS or ElevenLabs
        return None
