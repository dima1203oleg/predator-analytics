import os
import time
import sys
from pathlib import Path

# Додаємо кореневу папку в sys.path, щоб імпортувати app.services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.voice_service import VoiceService

BUFFER_FILE = "speak_buffer.txt"
AUDIO_OUTPUT = "voice_output.mp3"

    print(f"🎙️  PREDATOR VOICE DAEMON запущено...")
    print(f"👀  Стежу за файлом: {BUFFER_FILE}")
    print(f"🔊  Вихід аудіо: {AUDIO_OUTPUT}")
    print("---------------------------------------------------")

    # Переконаємось, що змінні оточення на місці
    if not os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
        # Спробуємо знайти типовий ключ
        default_key = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "keys", "google-key.json")
        if os.path.exists(default_key):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = default_key
            print(f"🔑  Знайдено та завантажено ключ: {default_key}")
        else:
            print("❌  Ключ не знайдено! Встановіть GOOGLE_APPLICATION_CREDENTIALS.")
            return

    service = VoiceService()

    # Створимо файл, якщо немає
    if not os.path.exists(BUFFER_FILE):
        with open(BUFFER_FILE, "w") as f:
            f.write("")

    last_mtime = 0

    while True:
        try:
            time.sleep(1)
            current_mtime = os.path.getmtime(BUFFER_FILE)

            if current_mtime != last_mtime:
                last_mtime = current_mtime

                # Читаємо текст
                with open(BUFFER_FILE, "r", encoding="utf-8") as f:
                    text = f.read().strip()

                if text:
                    print(f"\n💬  Отримано текст: {text[:50]}...")

                    # EARLY CLEAR: Очищуємо файл одразу, щоб watchdog не вбив процес
                    # під час довгої генерації/відтворення
                    with open(BUFFER_FILE, "w") as f:
                        f.write("")

                    # Генеруємо аудіо
                    try:
                        service.text_to_speech(text, AUDIO_OUTPUT)
                        print("✅  Аудіо згенеровано.")

                        # Програємо аудіо
                        print("▶️  Відтворення...")
                        os.system(f"afplay {AUDIO_OUTPUT}")

                    except Exception as e:
                        print(f"❌  Помилка синтезу/відтворення: {e}")

        except KeyboardInterrupt:
            print("\n👋 Демон зупинено.")
            break
        except Exception as e:
            print(f"⚠️  Помилка циклу: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
