"""File OSINT Router — аналіз метаданих файлів."""
import uuid
import tempfile
import os

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File

from app.models import FileAnalysisResult, ScanProgress
from app.services.scan_service import ScanService

router = APIRouter(prefix="/file", tags=["File OSINT"])


@router.post("/analyze", response_model=dict)
async def analyze_file(
    file: UploadFile = File(...),
    extract_metadata: bool = True,
    extract_hidden_data: bool = True,
    extract_geolocation: bool = True,
):
    """Аналіз метаданих файлу.

    Підтримує:
    - Фото (JPEG, PNG, TIFF, RAW)
    - Відео (MP4, MOV, AVI)
    - Документи (PDF, DOCX, XLSX)
    - Аудіо (MP3, WAV, FLAC)

    Args:
        file: Файл для аналізу
        extract_metadata: Витягувати метадані
        extract_hidden_data: Шукати приховані дані
        extract_geolocation: Витягувати GPS координати

    Returns:
        analysis_id та результати
    """
    analysis_id = str(uuid.uuid4())

    # Зберігаємо файл тимчасово
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        scan_service = ScanService()
        result = await scan_service.run_file_analysis(
            analysis_id=analysis_id,
            file_path=tmp_path,
            file_name=file.filename,
            file_size=len(content),
            options={
                "extract_metadata": extract_metadata,
                "extract_hidden_data": extract_hidden_data,
                "extract_geolocation": extract_geolocation,
            },
        )

        return {
            "analysis_id": analysis_id,
            "status": "completed",
            "result": result,
        }

    finally:
        # Видаляємо тимчасовий файл
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.get("/{analysis_id}", response_model=FileAnalysisResult)
async def get_file_analysis_result(analysis_id: str):
    """Отримання результатів аналізу файлу.

    Args:
        analysis_id: ID аналізу

    Returns:
        Результати аналізу
    """
    scan_service = ScanService()
    result = await scan_service.get_scan_result(analysis_id)

    if not result:
        raise HTTPException(status_code=404, detail="Аналіз не знайдено")

    return result
