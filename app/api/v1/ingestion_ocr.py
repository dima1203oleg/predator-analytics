from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import Dict, Any, List
from app.services.ingestion.ocr import OCRWorker, get_ocr_worker

router = APIRouter(prefix="/ingest/ocr", tags=["Data Ingestion & OCR"])

@router.post("/process")
async def process_document_ocr(
    file: UploadFile = File(...),
    lang: str = "ukr+eng",
    worker: OCRWorker = Depends(get_ocr_worker)
) -> Dict[str, Any]:
    """
    Performs OCR on uploaded image or PDF scan (COMP-009).
    """
    if file.content_type not in ["image/jpeg", "image/png", "application/pdf"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Supported: JPG, PNG, PDF")
        
    return worker.extract_text(file.filename, lang)
