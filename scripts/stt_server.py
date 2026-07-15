#!/Users/Shared/Predator_60/services/core-api/.venv/bin/python3
"""
STT Server — faster-whisper Ukrainian STT
Запускається з core-api/.venv де встановлений faster-whisper
Приймає шлях до аудіофайлу через argv, повертає текст через stdout
"""
import sys
import json
import logging
import os

logging.basicConfig(level=logging.WARNING, stream=sys.stderr)
logger = logging.getLogger("stt_server")

def transcribe(audio_path: str) -> str:
    try:
        from faster_whisper import WhisperModel
        
        # Визначаємо розмір моделі (small для швидкості)
        model_size = os.environ.get("WHISPER_MODEL", "small")
        
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        segments, info = model.transcribe(
            audio_path,
            beam_size=5,
            language="uk",
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500}
        )
        
        text = " ".join([seg.text for seg in segments]).strip()
        return text or ""
    except Exception as e:
        logger.error(f"STT помилка: {e}")
        return ""

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Потрібен шлях до аудіофайлу"}))
        sys.exit(1)
    
    audio_path = sys.argv[1]
    if not os.path.exists(audio_path):
        print(json.dumps({"error": f"Файл не знайдено: {audio_path}"}))
        sys.exit(1)
    
    text = transcribe(audio_path)
    print(json.dumps({"text": text}))
