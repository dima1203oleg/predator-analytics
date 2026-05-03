from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.osint_vision_service import osint_vision_service

router = APIRouter(prefix="/osint/vision", tags=["osint-vision"])

@router.post("/parse-declaration")
async def parse_declaration(file: UploadFile = File(...)):
    """Завантажити та проаналізувати митну декларацію (Image/PDF)."""
    if not file.content_type.startswith("image/") and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Тільки зображення або PDF")

    try:
        content = await file.read()
        # Для PDF Gemini теж підтримує mime_type="application/pdf"
        result = await osint_vision_service.parse_customs_declaration(content, file.content_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
