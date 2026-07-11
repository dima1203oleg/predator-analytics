from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import asyncio

from app.services.speech import vad_service, stt_service, tts_service
from app.services.antigravity_orchestrator import orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["voice"])

@router.websocket("/stream")
async def voice_stream(websocket: WebSocket):
    """
    Двонаправлений WebSocket для потокового аудіо.
    Клієнт відправляє аудіо-чанки (16kHz 16-bit PCM).
    Сервер повертає синтезоване аудіо-відповідь (WAV).
    """
    await websocket.accept()
    logger.info("Клієнт підключився до WebSocket потоку голосу.")
    
    # Буфер для зберігання аудіо до кінця фрази
    audio_buffer = bytearray()
    silence_frames = 0
    SILENCE_THRESHOLD = 30 # Кількість чанків тиші, щоб вважати фразу завершеною (залежить від розміру чанку)

    try:
        while True:
            # Очікуємо аудіо-фрейм від клієнта
            data = await websocket.receive_bytes()
            
            # Перевіряємо VAD
            has_speech = vad_service.has_speech(data)
            
            if has_speech:
                audio_buffer.extend(data)
                silence_frames = 0
            else:
                if len(audio_buffer) > 0:
                    silence_frames += 1
                
                # Якщо довго була тиша, і в буфері є аудіо — відправляємо на STT
                if silence_frames > SILENCE_THRESHOLD and len(audio_buffer) > 32000: # ~1 секунда мінімум
                    logger.info("Зафіксовано кінець фрази. Розпізнавання...")
                    
                    # 1. Розпізнавання
                    try:
                        text = await stt_service.transcribe(bytes(audio_buffer))
                        logger.info(f"Розпізнано текст: {text}")
                        
                        if text.strip():
                            # Очищуємо буфер після розпізнавання
                            audio_buffer.clear()
                            silence_frames = 0
                            
                            # 2. Відправляємо текст оркестратору / LLM (поки що заглушка)
                            # Наразі просто відлуння, поки не підключимо LangGraph повноцінно
                            response_text = text # Ехо для тестування
                            
                            # 3. Синтез і повернення потокового аудіо
                            # Тут tts_service.synthesize_stream має повернути генератор чанків
                            async def text_gen():
                                yield response_text
                                
                            async for audio_chunk in tts_service.synthesize_stream(text_gen()):
                                await websocket.send_bytes(audio_chunk)
                                
                    except Exception as e:
                        logger.error(f"Помилка в циклі розпізнавання/синтезу: {e}")
                        audio_buffer.clear()
                        silence_frames = 0
                        
    except WebSocketDisconnect:
        logger.info("Клієнт відключився від WebSocket потоку.")
    except Exception as e:
        logger.error(f"Неочікувана помилка WebSocket: {e}")
