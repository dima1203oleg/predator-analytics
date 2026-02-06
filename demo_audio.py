import os
from app.services.audio_manager import AudioManager

def run_demo():
    print("--- Початок Аудіо Демо ---")

    # Перевірка змінної середовища
    creds = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if not creds:
        print("❌ ПОМИЛКА: Не встановлено змінну 'GOOGLE_APPLICATION_CREDENTIALS'.")
        print("Будь ласка, встановіть шлях до JSON-ключа.")
        return

    print(f"🔑 Використовуються ключі: {creds}")

    manager = AudioManager()

    # 1. Text to Speech
    text_to_say = "Привіт! Це демонстрація системи Predator. Слава Україні!"
    audio_file = "demo_audio.mp3"

    print(f"\n🗣️  Генеруємо голос з тексту: '{text_to_say}'")
    try:
        manager.text_to_speech(text_to_say, audio_file)
        print("✅ TTS успішно завершено.")
    except Exception as e:
        print(f"❌ Помилка TTS: {e}")
        return

    # 2. Speech to Text
    print(f"\n👂 Розпізнаємо текст з файлу: '{audio_file}'")
    try:
        recognized_text = manager.speech_to_text(audio_file)
        print(f"📝 Розпізнаний текст: '{recognized_text}'")

        if recognized_text:
            print("✅ STT успішно завершено.")
        else:
            print("⚠️ Текст не розпізнано (можливо, аудіо пусте або нечітке).")

    except Exception as e:
         print(f"❌ Помилка STT: {e}")

    # Прибирання
    # os.remove(audio_file)
    print("\n--- Демо завершено ---")

if __name__ == "__main__":
    run_demo()
