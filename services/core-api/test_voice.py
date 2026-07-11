import asyncio
import os
from app.services.voice_service import voice_service

async def main():
    print("Ініціалізація voice_service...")
    await voice_service.initialize()
    
    print("\nТест 1: Синтез мовлення (TTS)")
    text = "Система Когнітивне Ядро успішно ініціалізована. Всі системи працюють в штатному режимі."
    audio_bytes = await voice_service.synthesize_speech(text)
    
    if len(audio_bytes) > 100:
        print(f"✅ TTS успішно згенерував {len(audio_bytes)} байт аудіо.")
        with open("test_tts.wav", "wb") as f:
            f.write(audio_bytes)
    else:
        print("❌ TTS згенерував замало байт або порожній файл.")
        
    print("\nТест 2: Розпізнавання мовлення (STT)")
    if os.path.exists("test_tts.wav"):
        with open("test_tts.wav", "rb") as f:
            audio_data = f.read()
        transcription = await voice_service.transcribe_audio(audio_data)
        print(f"✅ STT розпізнав текст: '{transcription}'")
    else:
        print("❌ Аудіофайл для STT не знайдено.")

if __name__ == "__main__":
    asyncio.run(main())
