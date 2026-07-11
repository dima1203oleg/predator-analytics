from fastapi import APIRouter, UploadFile, File, HTTPException, Response
from pydantic import BaseModel
from typing import Optional
import logging

from app.services.speech import stt_service, tts_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["voice"])

class SynthesizeRequest(BaseModel):
    text: str

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Транскрибує аудіофайл (Speech-to-Text) за допомогою faster-whisper.
    """
    try:
        content = await file.read()
        text = await stt_service.transcribe(content)
        return {"text": text}
    except Exception as e:
        logger.error(f"Failed to transcribe audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/synthesize")
async def synthesize_speech(request: SynthesizeRequest):
    """
    Синтезує мовлення з тексту (Text-to-Speech) за допомогою Piper.
    """
    try:
        audio_bytes = await tts_service.synthesize(request.text)
        return Response(content=audio_bytes, media_type="audio/wav")
    except Exception as e:
        logger.error(f"Failed to synthesize speech: {e}")
        raise HTTPException(status_code=500, detail=str(e))
