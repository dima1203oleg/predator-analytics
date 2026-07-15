import os
import asyncio
import logging
import io
import tempfile
import wave
from typing import Optional, AsyncGenerator

logger = logging.getLogger(__name__)

class STTService:
    def __init__(self):
        self.model = None
        # Можна налаштувати через env var (large-v3-turbo, medium, small)
        self.model_size = os.environ.get("WHISPER_MODEL", "small")
        self.device = "cuda" if os.environ.get("CUDA_VISIBLE_DEVICES") else "cpu"
        self.compute_type = "float16" if self.device == "cuda" else "int8"
        self._is_ready = False
        
    async def initialize(self):
        """Ініціалізація моделі faster-whisper."""
        try:
            try:
                from faster_whisper import WhisperModel
                logger.info(f"Ініціалізація faster-whisper (model={self.model_size}, device={self.device})...")
                
                def _load_model():
                    return WhisperModel(self.model_size, device=self.device, compute_type=self.compute_type)
                    
                loop = asyncio.get_event_loop()
                self.model = await loop.run_in_executor(None, _load_model)
                logger.info("faster-whisper успішно завантажено.")
                self._is_ready = True
            except ImportError:
                logger.warning("faster_whisper not installed! STT will be unavailable.")
                self.model = "mock"
                self._is_ready = True
        except Exception as e:
            logger.error(f"Помилка ініціалізації faster-whisper: {e}")
            self.model = None
            self._is_ready = False

    async def transcribe(self, audio_bytes: bytes) -> str:
        """Синхронне розпізнавання цілого файлу."""
        if not self._is_ready:
            await self.initialize()

        if not self.model:
            raise Exception("Модель STT не ініціалізована")

        if self.model == "mock":
            logger.info("MOCK STT: Returning dummy transcription.")
            return "Привіт, це тестова транскрипція від мокового модуля STT."
            
        loop = asyncio.get_event_loop()
        
        def _run_transcribe():
            # Записуємо байти у тимчасовий файл, бо WhisperModel приймає шлях до файлу або file-like
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name
                
            try:
                segments, info = self.model.transcribe(tmp_path, beam_size=5, language="uk")
                text = " ".join([segment.text for segment in segments])
                return text.strip()
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                    
        text = await loop.run_in_executor(None, _run_transcribe)
        return text

    async def transcribe_stream(self, audio_chunk: bytes) -> str:
        """
        Метод для потокового розпізнавання (симульованого через накопичення).
        Для цього ми зберігатимемо аудіо та розпізнаватимемо його порціями.
        """
        # Спрощена реалізація для початку: просто викликає transcribe
        # Для повноцінного потокового STT потрібен VAD і буферизація
        return await self.transcribe(audio_chunk)

stt_service = STTService()
