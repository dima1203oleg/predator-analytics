"""Person OSINT Router — пошук інформації про особу."""
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.models import (
    PersonSearchRequest,
    PersonSearchResult,
    ScanProgress,
)
from app.services.scan_service import ScanService

router = APIRouter(prefix="/person", tags=["Person OSINT"])


@router.post("/search", response_model=dict)
async def search_person(
    request: PersonSearchRequest,
    background_tasks: BackgroundTasks,
):
    """Пошук інформації про особу.

    Виконує пошук за:
    - Username (Sherlock, Maigret)
    - Email (theHarvester, Hunter.io)
    - Телефон (спеціалізовані джерела)
    - Ім'я (соціальні мережі)

    Args:
        request: Параметри пошуку

    Returns:
        search_id та URL для отримання результатів
    """
    # Валідація: потрібен хоча б один ідентифікатор
    if not any([request.username, request.email, request.phone, request.full_name]):
        raise HTTPException(
            status_code=400,
            detail="Потрібен хоча б один ідентифікатор: username, email, phone або full_name",
        )

    search_id = str(uuid.uuid4())

    scan_service = ScanService()
    background_tasks.add_task(
        scan_service.run_person_search,
        search_id=search_id,
        username=request.username,
        email=request.email,
        phone=request.phone,
        full_name=request.full_name,
        tools=request.tools,
    )

    return {
        "search_id": search_id,
        "status": "queued",
        "progress_url": f"/api/v1/osint/person/{search_id}",
        "estimated_time_seconds": 180,
    }


@router.get("/{search_id}", response_model=PersonSearchResult)
async def get_person_search_result(search_id: str):
    """Отримання результатів пошуку особи.

    Args:
        search_id: ID пошуку

    Returns:
        Результати пошуку
    """
    scan_service = ScanService()
    result = await scan_service.get_scan_result(search_id)

    if not result:
        raise HTTPException(status_code=404, detail="Пошук не знайдено")

    return result


@router.get("/{search_id}/progress", response_model=ScanProgress)
async def get_person_search_progress(search_id: str):
    """Отримання прогресу пошуку.

    Args:
        search_id: ID пошуку

    Returns:
        Поточний прогрес
    """
    scan_service = ScanService()
    progress = await scan_service.get_scan_progress(search_id)

    if not progress:
        raise HTTPException(status_code=404, detail="Пошук не знайдено")

    return progress


@router.post("/username/{username}")
async def quick_username_search(
    username: str,
    background_tasks: BackgroundTasks,
):
    """Швидкий пошук за username.

    Спрощений endpoint для пошуку тільки за username.

    Args:
        username: Username для пошуку

    Returns:
        search_id та URL для результатів
    """
    search_id = str(uuid.uuid4())

    scan_service = ScanService()
    background_tasks.add_task(
        scan_service.run_person_search,
        search_id=search_id,
        username=username,
        tools=["sherlock", "maigret"],
    )

    return {
        "search_id": search_id,
        "status": "queued",
        "progress_url": f"/api/v1/osint/person/{search_id}",
    }
