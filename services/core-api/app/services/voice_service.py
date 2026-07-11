import os
import asyncio
import logging
from typing import Optional
import tempfile

logger = logging.getLogger(__name__)

class VoiceService:
    def __init__(self):
        self.whisper_model = None
        self.piper_voice = None
        self.device = "cuda" if os.environ.get("CUDA_VISIBLE_DEVICES") else "cpu"
        # We will try to use CUDA if available, but fallback gracefully if library is missing or fails.

    async def initialize(self):
        """Ініціалізація моделей."""
        try:
            from faster_whisper import WhisperModel
            
            logger.info(f"Ініціалізація faster-whisper (device={self.device})...")
            # Використовуємо 'base' або 'small' для балансу швидкості та якості
            compute_type = "float16" if self.device == "cuda" else "int8"
            self.whisper_model = WhisperModel("small", device=self.device, compute_type=compute_type)
            logger.info("faster-whisper успішно завантажено.")
        except Exception as e:
            logger.error(f"Помилка ініціалізації faster-whisper: {e}")
            self.whisper_model = None

        try:
            from piper.voice import PiperVoice
            
            logger.info(f"Ініціалізація Piper TTS (device={self.device})...")
            
            # Для Piper потрібен шлях до моделі (.onnx) та конфігу (.json).
            # Якщо моделі немає локально, ми завантажуємо її або використовуємо mock для тестів.
            model_path = os.path.join(os.path.dirname(__file__), "uk_UA-ukrainian_tts-medium.onnx")
            
            if os.path.exists(model_path):
                # Piper supports CUDA via onnxruntime-gpu if installed
                use_cuda = self.device == "cuda"
                self.piper_voice = PiperVoice.load(model_path, config_path=f"{model_path}.json", use_cuda=use_cuda)
                logger.info("Piper успішно завантажено.")
            else:
                logger.warning(f"Piper модель не знайдена за шляхом: {model_path}. Синтез працюватиме у MOCK-режимі.")
        except Exception as e:
            logger.error(f"Помилка ініціалізації Piper: {e}")
            self.piper_voice = None

    async def transcribe_audio(self, file_bytes: bytes) -> str:
        """Перетворення аудіо у текст (Speech-to-Text)."""
        if not self.whisper_model:
            return "[MOCK] Розпізнавання недоступне, оскільки модель не завантажена."
            
        try:
            # Створюємо тимчасовий файл для faster-whisper
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            # Виконуємо транскрипцію
            # Уникаємо блокування event loop
            loop = asyncio.get_running_loop()
            
            def _run_transcribe():
                segments, info = self.whisper_model.transcribe(tmp_path, beam_size=5, language="uk")
                return " ".join([segment.text for segment in segments])

            result = await loop.run_in_executor(None, _run_transcribe)
            
            # Видаляємо тимчасовий файл
            os.remove(tmp_path)
            
            return result.strip()
        except Exception as e:
            logger.error(f"Помилка транскрипції: {e}")
            raise Exception(f"Помилка транскрипції: {e}")

    async def synthesize_speech(self, text: str) -> bytes:
        """Синтез тексту у мовлення (Text-to-Speech)."""
        if not self.piper_voice:
            # Повертаємо пустий wav файл для mock-режиму
            logger.warning("Piper модель недоступна. Повертаємо пусте аудіо.")
            return self._generate_empty_wav()
            
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp_path = tmp.name

            loop = asyncio.get_running_loop()
            
            def _run_synthesize():
                import wave
                with wave.open(tmp_path, "wb") as wav_file:
                    self.piper_voice.synthesize_wav(text.lower(), wav_file)

            await loop.run_in_executor(None, _run_synthesize)
            
            with open(tmp_path, "rb") as f:
                audio_bytes = f.read()
                
            os.remove(tmp_path)
            
            return audio_bytes
        except Exception as e:
            logger.error(f"Помилка синтезу мовлення: {e}")
            raise Exception(f"Помилка синтезу мовлення: {e}")
            
    def _generate_empty_wav(self) -> bytes:
        """Генерує мінімальний порожній WAV файл для тестів/MOCK."""
        import io
        import wave
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(22050)
            wav.writeframes(b'')
        return buf.getvalue()

voice_service = VoiceService()
