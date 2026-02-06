import os
import sys
import uuid
import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.services.voice_service import VoiceService

# Налаштування логування
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("predator-voice")

app = FastAPI(title="Predator Voice API", version="1.0.0")
voice_service = VoiceService()

# Створюємо тимчасові папки для аудіо
TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

class TTSRequest(BaseModel):
    text: str
    voice_name: Optional[str] = None

@app.get("/")
async def root():
    return {"status": "online", "message": "Predator Voice API is active"}

@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Конвертує текст у MP3 файл та повертає його.
    """
    if not request.text:
        raise HTTPException(status_code=400, detail="Text is required")

    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(TEMP_DIR, filename)

    try:
        voice_service.text_to_speech(request.text, filepath)
        return FileResponse(path=filepath, media_type="audio/mpeg", filename="response.mp3")
    except Exception as e:
        logger.error(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stt")
async def speech_to_text(file: UploadFile = File(...)):
    """
    Отримує аудіофайл та повертає розпізнаний текст.
    """
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(TEMP_DIR, filename)

    # Зберігаємо завантажений файл
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    try:
        text = voice_service.speech_to_text(filepath)
        # Очищуємо файл після обробки
        os.remove(filepath)
        return {"text": text}
    except Exception as e:
        logger.error(f"STT Error: {e}")
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
