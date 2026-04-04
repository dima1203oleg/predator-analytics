from unittest.mock import AsyncMock, MagicMock

from httpx import ASGITransport, AsyncClient
import pytest

from app.core.security import get_current_user_payload
from app.database import get_db
from app.dependencies import get_tenant_id
from app.main import app
from app.models.orm import Person
from app.models.schemas import EntityStatus, RiskLevel


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
        "permissions": ["read_corp_data"]
    }

@pytest.fixture
def mock_db():
    return AsyncMock()

@pytest.mark.asyncio
async def test_list_persons(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_person = MagicMock(spec=Person)
    mock_person.ueid = "person-123"
    mock_person.full_name = "Іванов Іван"
    mock_person.inn = "1234567890"
    mock_person.status = EntityStatus.ACTIVE.value
    mock_person.risk_level = RiskLevel.STABLE.value
    mock_person.risk_score = 10.0
    from datetime import datetime
    mock_person.created_at = datetime.now()
    mock_person.updated_at = datetime.now()

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_person]
    mock_db.execute = AsyncMock(return_value=mock_result)

    response = await async_client.get("/api/v1/persons/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["ueid"] == "person-123"

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_person_success(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_person = MagicMock(spec=Person)
    mock_person.ueid = "person-123"
    mock_person.full_name = "Іванов Іван"
    mock_person.inn = "1234567890"
    mock_person.status = EntityStatus.ACTIVE.value
    mock_person.risk_level = RiskLevel.STABLE.value
    mock_person.risk_score = 10.0
    from datetime import datetime
    mock_person.created_at = datetime.now()
    mock_person.updated_at = datetime.now()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_person
    mock_db.execute = AsyncMock(return_value=mock_result)

    response = await async_client.get("/api/v1/persons/person-123")
    assert response.status_code == 200
    assert response.json()["ueid"] == "person-123"

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_person_not_found(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=mock_result)

    response = await async_client.get("/api/v1/persons/non-existent")
    assert response.status_code == 404

    app.dependency_overrides.clear()
