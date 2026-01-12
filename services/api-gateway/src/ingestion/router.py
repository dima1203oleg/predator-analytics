from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from .manager import IngestionManager
from .models import FileRegistry, IngestionStatus
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])

@router.post("/upload", response_model=dict)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Uploads a file, checks for duplicates, and queues it for ingestion.
    """
    tenant_id = current_user.get("tenant_id", "00000000-0000-0000-0000-000000000000")
    manager = IngestionManager(db)
    record = await manager.handle_upload(file, tenant_id=tenant_id)

    if record.status == IngestionStatus.PENDING:
        # Trigger processing in background (later move to Celery)
        background_tasks.add_task(manager.process_file, record.id, tenant_id=tenant_id)
        return {
            "status": "accepted",
            "file_id": record.id,
            "message": "File uploaded and ingestion started."
        }
    elif record.status == IngestionStatus.COMPLETED:
        return {
            "status": "exists",
            "file_id": record.id,
            "message": "File already exists and was processed."
        }
    else:
         return {
            "status": record.status,
            "file_id": record.id,
            "message": f"File exists in state {record.status}"
        }

@router.get("/files")
async def list_files(db: AsyncSession = Depends(get_db)):
    # TODO: Add pagination
    from sqlalchemy.future import select
    result = await db.execute(select(FileRegistry).order_by(FileRegistry.created_at.desc()).limit(50))
    files = result.scalars().all()
    return files
