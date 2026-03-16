"""Domain OSINT Router — сканування доменів."""
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.models import (
    DomainScanRequest,
    DomainScanResult,
    ScanProgress,
)
from app.services.scan_service import ScanService

router = APIRouter(prefix="/domain", tags=["Domain OSINT"])


@router.post("/scan", response_model=dict)
async def scan_domain(
    request: DomainScanRequest,
    background_tasks: BackgroundTasks,
):
    """Запуск сканування домену.

    Виконує комплексне сканування домену з використанням:
    - Amass (субдомени)
    - Subfinder (субдомени)
    - theHarvester (email, хости)
    - Photon (веб-краулінг)

    Args:
        request: Параметри сканування

    Returns:
        scan_id та URL для отримання результатів
    """
    scan_id = str(uuid.uuid4())

    # Запускаємо сканування в фоні
    scan_service = ScanService()
    background_tasks.add_task(
        scan_service.run_domain_scan,
        scan_id=scan_id,
        domain=request.domain,
        tools=request.tools,
        depth=request.depth,
        options={
            "include_subdomains": request.include_subdomains,
            "include_emails": request.include_emails,
            "include_technologies": request.include_technologies,
        },
    )

    return {
        "scan_id": scan_id,
        "status": "queued",
        "progress_url": f"/api/v1/osint/domain/{scan_id}",
        "estimated_time_seconds": 120,
    }


@router.get("/{scan_id}", response_model=DomainScanResult)
async def get_domain_scan_result(scan_id: str):
    """Отримання результатів сканування домену.

    Args:
        scan_id: ID сканування

    Returns:
        Результати сканування
    """
    scan_service = ScanService()
    result = await scan_service.get_scan_result(scan_id)

    if not result:
        raise HTTPException(status_code=404, detail="Сканування не знайдено")

    return result


@router.get("/{scan_id}/progress", response_model=ScanProgress)
async def get_domain_scan_progress(scan_id: str):
    """Отримання прогресу сканування.

    Args:
        scan_id: ID сканування

    Returns:
        Поточний прогрес
    """
    scan_service = ScanService()
    progress = await scan_service.get_scan_progress(scan_id)

    if not progress:
        raise HTTPException(status_code=404, detail="Сканування не знайдено")

    return progress


@router.delete("/{scan_id}")
async def cancel_domain_scan(scan_id: str):
    """Скасування сканування.

    Args:
        scan_id: ID сканування

    Returns:
        Статус скасування
    """
    scan_service = ScanService()
    cancelled = await scan_service.cancel_scan(scan_id)

    if not cancelled:
        raise HTTPException(status_code=404, detail="Сканування не знайдено або вже завершено")

    return {"scan_id": scan_id, "status": "cancelled"}
