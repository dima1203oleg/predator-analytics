import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch, MagicMock
from app.main import app
from app.core.security import get_current_user_payload, get_current_active_user
from app.dependencies import get_tenant_id, get_db
from app.services.kafka_service import get_kafka_service
from app.services.minio_service import get_minio_service
from predator_common.models import IngestionJob
import uuid

@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.fixture
def mock_user():
    return {
        "sub": "user-123",
        "role": "admin",
        "tenant_id": "test-tenant",
        "is_active": True
    }

@pytest.fixture
def mock_db():
    db = AsyncMock()
    return db

@pytest.mark.asyncio
async def test_upload_file_success(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_current_active_user] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    # Mock MinIO and Kafka services
    mock_minio = AsyncMock()
    mock_minio.upload_file.return_value = (True, "s3://path/to/file.csv", None)
    mock_minio.BUCKET_INGESTION = "ingestion"
    
    mock_kafka = AsyncMock()
    
    # Filesystem/Multipart mock
    file_content = b"edrpou,name\n12345678,Test Comp"
    files = {"file": ("test.csv", file_content, "text/csv")}
    data = {"dataset_name": "Test Dataset"}

    with patch("app.routers.ingestion.get_minio_service", return_value=mock_minio), \
         patch("app.routers.ingestion.get_kafka_service", return_value=mock_kafka):
        
        response = await async_client.post("/api/v1/ingestion/upload", files=files, data=data)
        
    assert response.status_code == 202
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "queued"
    assert mock_db.add.called
    assert mock_db.commit.called
    assert mock_minio.upload_file.called
    assert mock_kafka.publish_file_upload.called

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_job_progress(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    job_id = str(uuid.uuid4())
    mock_job = MagicMock(spec=IngestionJob)
    mock_job.id = job_id
    mock_job.status = "running"
    mock_job.file_name = "test.csv"
    mock_job.records_total = 100
    mock_job.records_processed = 45
    mock_job.records_errors = 0
    mock_job.progress = 45
    mock_job.created_at = None
    mock_job.started_at = None
    mock_job.completed_at = None
    mock_job.error_message = None

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_job

    response = await async_client.get(f"/api/v1/ingestion/progress/{job_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == job_id
    assert data["progress_pct"] == 45

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_ingestion_status(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.scalar.return_value = 5

    response = await async_client.get("/api/v1/ingestion/status")
    assert response.status_code == 200
    assert response.json()["active_jobs"] == 5

    app.dependency_overrides.clear()
