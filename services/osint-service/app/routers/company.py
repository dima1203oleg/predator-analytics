"""Company OSINT Router — розслідування компаній."""
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.models import (
    CompanyInvestigationRequest,
    CompanyInvestigationResult,
    ScanProgress,
)
from app.services.scan_service import ScanService

router = APIRouter(prefix="/company", tags=["Company OSINT"])


@router.post("/investigate", response_model=dict)
async def investigate_company(
    request: CompanyInvestigationRequest,
    background_tasks: BackgroundTasks,
):
    """Розслідування компанії.

    Збирає інформацію про:
    - Реєстраційні дані (ЄДРПОУ, назва)
    - Керівництво та засновників
    - Пов'язані компанії
    - Санкції та ризики
    - Домени та веб-присутність

    Args:
        request: Параметри розслідування

    Returns:
        investigation_id та URL для результатів
    """
    if not any([request.company_name, request.edrpou, request.domain]):
        raise HTTPException(
            status_code=400,
            detail="Потрібен хоча б один ідентифікатор: company_name, edrpou або domain",
        )

    investigation_id = str(uuid.uuid4())

    scan_service = ScanService()
    background_tasks.add_task(
        scan_service.run_company_investigation,
        investigation_id=investigation_id,
        company_name=request.company_name,
        edrpou=request.edrpou,
        domain=request.domain,
        country=request.country,
        options={
            "include_officers": request.include_officers,
            "include_shareholders": request.include_shareholders,
            "include_sanctions": request.include_sanctions,
        },
    )

    return {
        "investigation_id": investigation_id,
        "status": "queued",
        "progress_url": f"/api/v1/osint/company/{investigation_id}",
        "estimated_time_seconds": 300,
    }


@router.get("/{investigation_id}", response_model=CompanyInvestigationResult)
async def get_company_investigation_result(investigation_id: str):
    """Отримання результатів розслідування компанії.

    Args:
        investigation_id: ID розслідування

    Returns:
        Результати розслідування
    """
    scan_service = ScanService()
    result = await scan_service.get_scan_result(investigation_id)

    if not result:
        raise HTTPException(status_code=404, detail="Розслідування не знайдено")

    return result


@router.get("/{investigation_id}/progress", response_model=ScanProgress)
async def get_company_investigation_progress(investigation_id: str):
    """Отримання прогресу розслідування.

    Args:
        investigation_id: ID розслідування

    Returns:
        Поточний прогрес
    """
    scan_service = ScanService()
    progress = await scan_service.get_scan_progress(investigation_id)

    if not progress:
        raise HTTPException(status_code=404, detail="Розслідування не знайдено")

    return progress


@router.get("/edrpou/{edrpou}")
async def quick_edrpou_lookup(
    edrpou: str,
    background_tasks: BackgroundTasks,
):
    """Швидкий пошук за ЄДРПОУ.

    Args:
        edrpou: Код ЄДРПОУ

    Returns:
        investigation_id та URL для результатів
    """
    if not edrpou.isdigit() or len(edrpou) != 8:
        raise HTTPException(
            status_code=400,
            detail="ЄДРПОУ має бути 8-значним числом",
        )

    investigation_id = str(uuid.uuid4())

    scan_service = ScanService()
    background_tasks.add_task(
        scan_service.run_company_investigation,
        investigation_id=investigation_id,
        edrpou=edrpou,
        country="UA",
    )

    return {
        "investigation_id": investigation_id,
        "status": "queued",
        "progress_url": f"/api/v1/osint/company/{investigation_id}",
    }
