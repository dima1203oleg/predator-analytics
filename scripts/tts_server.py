#!/Users/Shared/Predator_60/services/core-api/.venv/bin/python3
"""
TTS Server — Piper Ukrainian TTS
Запускається з core-api/.venv де встановлений piper-tts
Приймає текст через stdin, повертає WAV байти через stdout
"""
import sys
import io
import wave
import logging

logging.basicConfig(level=logging.WARNING, stream=sys.stderr)
logger = logging.getLogger("tts_server")

MODEL_PATH = "/Users/Shared/Predator_60/services/core-api/app/services/uk_UA-ukrainian_tts-medium.onnx"

def synthesize(text: str) -> bytes:
    try:
        from piper.voice import PiperVoice
        voice = PiperVoice.load(MODEL_PATH)
        
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(voice.config.sample_rate)
            voice.synthesize(text, wav_file)
        return buf.getvalue()
    except Exception as e:
        logger.error(f"TTS помилка: {e}")
        # Повертаємо порожній WAV при помилці
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(22050)
            wav_file.writeframes(b'\x00' * int(22050 * 2 * 0.5))
        return buf.getvalue()

if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read().strip()
    if not text:
        sys.exit(1)
    audio = synthesize(text)
    sys.stdout.buffer.write(audio)
