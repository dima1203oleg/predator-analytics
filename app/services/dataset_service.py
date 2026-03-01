from datetime import datetime
import uuid

from app.models.dataset import Dataset, DatasetCreate, DatasetStatus, DatasetType


# Mock DB for datasets
datasets_db = {}


class DatasetService:
    async def list_datasets(
        self, owner_id: str, dataset_type: DatasetType | None = None
    ) -> list[Dataset]:
        """List datasets for a user."""
        results = [d for d in datasets_db.values() if d.owner_id == owner_id]
        if dataset_type:
            results = [d for d in results if d.type == dataset_type]
        return results

    async def create_dataset(self, data: DatasetCreate, owner_id: str) -> Dataset:
        """Create a new dataset metadata."""
        dataset_id = str(uuid.uuid4())
        dataset = Dataset(
            id=dataset_id,
            name=data.name,
            description=data.description,
            type=data.type,
            owner_id=owner_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            status=DatasetStatus.DRAFT,
            is_training_source=data.is_training_source,
            is_generation_template=data.is_generation_template,
        )
        datasets_db[dataset_id] = dataset
        return dataset

    async def get_dataset(self, dataset_id: str) -> Dataset | None:
        return datasets_db.get(dataset_id)

    async def update_dataset_status(self, dataset_id: str, status: DatasetStatus, records: int = 0):
        if dataset_id in datasets_db:
            datasets_db[dataset_id].status = status
            datasets_db[dataset_id].records_count = records
            datasets_db[dataset_id].updated_at = datetime.utcnow()

    async def activate_dataset(self, dataset_id: str, active: bool):
        if dataset_id in datasets_db:
            datasets_db[dataset_id].is_active = active
            datasets_db[dataset_id].updated_at = datetime.utcnow()
