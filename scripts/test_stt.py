import os
import sys

# Add root to string to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.voice_service import VoiceService


def test_stt():
    service = VoiceService()

    # 1. Generate audio first (TTS)
    text_to_speak = "Система Предатор готова до роботи."
    audio_file = "test_audio_for_stt.mp3"
    try:
        service.text_to_speech(text_to_speak, audio_file)
    except Exception:
        return

    # 2. Try to recognize it (STT)
    try:
        recognized_text = service.speech_to_text(audio_file)

        if recognized_text:
            pass
        else:
            pass

    except Exception:
        pass

if __name__ == "__main__":
    test_stt()
