from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)

# Placeholder for real LLM Service
async def process_llm_stream(text: str):
    """
    Simulates streaming response from an LLM like DeepSeek-R1 (Ollama).
    """
    words = [
        "Отримав", "вашу", "команду.", "Система", "SOVEREIGN", "ініціалізує", "розширений", 
        "аналіз", "ризиків.", "Перевірка", "ланцюгів", "поставок...", "Готово."
    ]
    for word in words:
        await asyncio.sleep(0.3)
        yield word

@router.websocket("/stream")
async def avatar_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("Avatar WebSocket connection accepted.")
    
    try:
        while True:
            # Receive audio data or text from frontend
            # We expect binary data (WebM audio chunks from MediaRecorder) or text commands
            message = await websocket.receive()
            
            if "text" in message:
                user_text = message["text"]
                logger.info(f"Received text command: {user_text}")
                
                # Echo back status
                await websocket.send_json({"type": "status", "message": "processing_llm"})
                
                # Stream LLM Response
                async for chunk in process_llm_stream(user_text):
                    await websocket.send_json({"type": "token", "text": chunk})
                    
                # Signal completion
                await websocket.send_json({"type": "status", "message": "idle"})

            elif "bytes" in message:
                audio_data = message["bytes"]
                logger.info(f"Received audio chunk: {len(audio_data)} bytes")
                
                # 1. TODO: Send audio_data to STT Service (Whisper)
                # 2. Get transcribed text
                transcribed_text = "Імітація розпізнаної команди"
                await websocket.send_json({"type": "transcription", "text": transcribed_text})
                
                # 3. Process LLM
                async for chunk in process_llm_stream(transcribed_text):
                    # 4. TODO: Stream text to TTS Service (Piper) to get audio buffer + visemes
                    # Send viseme data and text to UI
                    await websocket.send_json({
                        "type": "token", 
                        "text": chunk,
                        "viseme": "O" # Example viseme for lip-sync
                    })
                    
                await websocket.send_json({"type": "status", "message": "idle"})
                
    except WebSocketDisconnect:
        logger.info("Avatar WebSocket disconnected.")
    except Exception as e:
        logger.error(f"Error in Avatar WebSocket: {str(e)}")
        try:
            await websocket.close(code=1011)
        except:
            pass
