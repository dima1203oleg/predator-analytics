import sys
import os

# Add root to string to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.voice_service import VoiceService

def test_stt():
    service = VoiceService()

    # 1. Generate audio first (TTS)
    text_to_speak = "Система Предатор готова до роботи."
    audio_file = "test_audio_for_stt.mp3"
    print(f"1. Generating audio: '{text_to_speak}'...")
    try:
        service.text_to_speech(text_to_speak, audio_file)
        print("   Audio generated.")
    except Exception as e:
        print(f"   TTS Failed: {e}")
        return

    # 2. Try to recognize it (STT)
    print("2. Recognizing audio (STT)...")
    try:
        recognized_text = service.speech_to_text(audio_file)
        print(f"   Result: '{recognized_text}'")

        if recognized_text:
            print("✅ STT works!")
        else:
            print("⚠️ STT returned empty string (might be silent or unmatched).")

    except Exception as e:
        print(f"❌ STT Failed: {e}")

if __name__ == "__main__":
    test_stt()
