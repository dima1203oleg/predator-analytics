import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.models.dataset import Dataset, DatasetCreate, DatasetType
from app.services.dataset_service import DatasetService

# Mock auth
try:
    from app.core.security import get_current_user
except ImportError:

    async def get_current_user():
        return type("User", (), {"id": "mock-user-id"})


router = APIRouter(prefix="/datasets", tags=["datasets"])
service = DatasetService()


@router.get("/", response_model=list[Dataset])
async def list_datasets(type: DatasetType | None = None, current_user=Depends(get_current_user)):
    """List user datasets."""
    return await service.list_datasets(getattr(current_user, "id", "anonymous"), type)


@router.post("/", response_model=Dataset)
async def create_dataset(data: DatasetCreate, current_user=Depends(get_current_user)):
    """Create a new empty dataset."""
    return await service.create_dataset(data, getattr(current_user, "id", "anonymous"))


@router.get("/{dataset_id}", response_model=Dataset)
async def get_dataset(dataset_id: str, current_user=Depends(get_current_user)):
    """Get dataset by ID."""
    dataset = await service.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.post("/{dataset_id}/activate")
async def activate_dataset(
    dataset_id: str, active: bool = True, current_user=Depends(get_current_user)
):
    """Activate/Deactivate dataset."""
    await service.activate_dataset(dataset_id, active)
    return {"status": "ok", "active": active}


class GenerationRequest(BaseModel):
    prototype_id: str
    augmentation_level: int
    row_count: int


@router.post("/generate")
async def generate_dataset(request: GenerationRequest, current_user=Depends(get_current_user)):
    """Generate synthetic dataset based on prototype."""
    # Mock generation logic
    return {
        "status": "success",
        "message": f"Generating {request.row_count} rows based on {request.prototype_id}",
        "job_id": "gen_" + str(uuid.uuid4()),
    }
