import os
import asyncio
import logging
import io
import wave
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

class TTSService:
    def __init__(self):
        self.model = None

    async def initialize(self):
        """Ініціалізація моделі Piper TTS."""
        try:
            from piper.voice import PiperVoice
            model_path = os.path.join(os.path.dirname(__file__), "..", "uk_UA-ukrainian_tts-medium.onnx")
            
            logger.info(f"Ініціалізація Piper TTS (шлях: {model_path})...")
            
            if not os.path.exists(model_path):
                logger.warning(f"Piper модель не знайдена за шляхом: {model_path}. Синтез працюватиме у MOCK-режимі.")
                self.model = "mock"
                return
                
            def _load_piper():
                return PiperVoice.load(model_path)
                
            loop = asyncio.get_event_loop()
            self.model = await loop.run_in_executor(None, _load_piper)
            logger.info("Piper TTS успішно завантажено.")
        except ImportError:
            logger.warning("piper-tts not installed. TTS will run in MOCK mode.")
            self.model = "mock"
        except Exception as e:
            logger.error(f"Помилка ініціалізації Piper TTS: {e}")
            self.model = "mock"

    async def synthesize(self, text: str) -> bytes:
        """Синхронний синтез (повертає WAV як байти)."""
        if self.model is None:
            await self.initialize()

        if self.model == "mock":
            logger.info(f"MOCK TTS: Synthesizing dummy audio for text: {text}")
            # Generate dummy WAV file
            buf = io.BytesIO()
            with wave.open(buf, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(22050)
                # 0.1 second of silence
                wav_file.writeframes(b'\x00' * int(22050 * 2 * 0.1))
            return buf.getvalue()

        def _synthesize_blocking():
            buf = io.BytesIO()
            with wave.open(buf, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(self.model.config.sample_rate)
                self.model.synthesize(text, wav_file)
            return buf.getvalue()
            
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _synthesize_blocking)

    async def synthesize_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """Асинхронний потоковий синтез (повертає PCM байти чанками)."""
        if self.model is None:
            await self.initialize()
            
        if self.model == "mock":
            logger.info(f"MOCK TTS Stream: Synthesizing dummy audio for text: {text}")
            yield b'\x00' * 1024
            return

        # Для потоку piper видає PCM чанки через synthesize_stream_raw
        # Оскільки це генератор, ми маємо загорнути його в async
        
        loop = asyncio.get_event_loop()
        
        # Це спрощена обгортка, в реальності краще використовувати thread queue
        # для справжнього асинхронного читання з генератора
        audio_stream = self.model.synthesize_stream_raw(text)
        
        for pcm_chunk in audio_stream:
            yield pcm_chunk
            await asyncio.sleep(0) # Віддаємо керування loop'у

tts_service = TTSService()
