import os
import torch
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class VADService:
    def __init__(self):
        self.model = None
        self.device = "cuda" if os.environ.get("CUDA_VISIBLE_DEVICES") else "cpu"
        self.get_speech_timestamps = None
        # We try to initialize lazily or at startup
        
    async def initialize(self):
        """Ініціалізація моделі Silero VAD."""
        try:
            logger.info(f"Ініціалізація Silero VAD (device={self.device})...")
            from silero_vad import load_silero_vad, get_speech_timestamps
            # Завантаження моделі
            self.model = load_silero_vad()
            self.get_speech_timestamps = get_speech_timestamps
            self.model.to(self.device)
            logger.info("Silero VAD успішно завантажено.")
        except Exception as e:
            logger.error(f"Помилка ініціалізації Silero VAD: {e}")
            self.model = None

    def has_speech(self, audio_data: bytes, sample_rate: int = 16000) -> bool:
        """
        Швидка перевірка наявності мовлення у фрагменті.
        audio_data має бути 16kHz, 16-bit PCM.
        """
        if not self.model:
            return True # Fallback: assume speech if no model

        try:
            # Перетворюємо bytes (16-bit PCM) у float32 tensor [-1.0, 1.0]
            import numpy as np
            audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
            audio_tensor = torch.from_numpy(audio_np).to(self.device)
            
            # get_speech_timestamps повертає список словників зі стартом/кінцем фрагментів мови
            speech_timestamps = get_speech_timestamps(audio_tensor, self.model, sampling_rate=sample_rate)
            
            return len(speech_timestamps) > 0
        except Exception as e:
            logger.error(f"Помилка детекції мовлення: {e}")
            return True

vad_service = VADService()
