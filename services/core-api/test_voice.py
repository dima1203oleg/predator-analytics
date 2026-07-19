import asyncio
from app.services.voice_service import voice_service

async def main():
    await voice_service.initialize()
    
    # Test STT (with empty wav or random bytes - wait, random bytes will crash whisper)
    print("TTS (Piper) Status:", "Mock" if not voice_service.piper_voice else "Loaded")
    print("STT (Whisper) Status:", "Mock" if not voice_service.whisper_model else "Loaded")
    
    if voice_service.whisper_model:
        print("Whisper model is loaded successfully.")
    else:
        print("Whisper failed to load.")
        
    if voice_service.piper_voice:
        print("Piper model is loaded successfully.")
    else:
        print("Piper model failed to load (Mock fallback active).")
        
if __name__ == "__main__":
    asyncio.run(main())
