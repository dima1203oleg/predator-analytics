
import os
import time
import sys
from pathlib import Path

# Додаємо кореневу папку в sys.path, щоб імпортувати app.services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.voice_service import VoiceService

BUFFER_FILE = "speak_buffer.txt"
AUDIO_OUTPUT = "voice_output.mp3"

def main():
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
    
    # Main Loop
    while True:
        try:
            if os.path.exists(BUFFER_FILE):
                with open(BUFFER_FILE, "r") as f:
                    text = f.read().strip()
                
                if text:
                    print(f"🗣️  Озвучую: {text[:50]}...")
                    service.speak(text, output_file=AUDIO_OUTPUT)
                    # Play audio (Mac specific)
                    os.system(f"afplay {AUDIO_OUTPUT}")
                
                # Clear buffer
                with open(BUFFER_FILE, "w") as f:
                    f.write("")
            
            time.sleep(1)
            
        except KeyboardInterrupt:
            print("🛑 Daemon зупинено.")
            break
        except Exception as e:
            print(f"⚠️  Помилка: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
