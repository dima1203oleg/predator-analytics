import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch, MagicMock
from app.main import app
from app.core.security import get_current_user_payload
from app.database import get_db
from app.dependencies import get_tenant_id
from app.core.permissions import Permission
from predator_common.models import RiskScore
from datetime import datetime, UTC

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
        "permissions": ["read_intel"]
    }

@pytest.fixture
def mock_db():
    return AsyncMock()

@pytest.mark.asyncio
async def test_get_cases_success(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_score = MagicMock(spec=RiskScore)
    mock_score.id = 1
    mock_score.entity_ueid = "company-123"
    mock_score.entity_type = "company"
    mock_score.cers = 85
    mock_score.score_date = datetime.now(UTC)
    mock_score.calculated_at = datetime.now(UTC)
    mock_score.explanation = {"summary": "Critical risk detected", "ai_insight": "AI insight here"}

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_score]
    mock_db.execute = AsyncMock(return_value=mock_result)

    response = await async_client.get("/api/v1/cases")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["status"] == "КРИТИЧНО"
    assert data[0]["priority"] == "critical"
    assert data[0]["risk_score"] == 85

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_cases_empty(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute = AsyncMock(return_value=mock_result)

    response = await async_client.get("/api/v1/cases")
    assert response.status_code == 200
    assert response.json() == []

    app.dependency_overrides.clear()
