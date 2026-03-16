import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch
from app.main import app
from app.database import get_db
from app.core.security import get_current_user_payload
from app.dependencies import get_tenant_id
from app.core.permissions import Permission
from predator_common.models import Company

@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.fixture
def mock_db():
    db = AsyncMock()
    return db

@pytest.fixture
def mock_user():
    return {
        "sub": "user-123",
        "role": "admin",
        "tenant_id": "test-tenant",
        "is_active": True
    }

@pytest.mark.asyncio
async def test_list_companies(async_client, mock_db, mock_user):
    # Setup dependency overrides
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    # Mock DB response
    mock_company = MagicMock(spec=Company)
    mock_company.ueid = "UEID-123"
    mock_company.name = "Test Company"
    mock_company.edrpou = "12345678"
    mock_company.status = "active"
    mock_company.sector = "Tech"
    mock_company.risk_score = 45.5
    mock_company.cers_confidence = 0.95
    mock_company.created_at = "2024-01-01T00:00:00"
    mock_company.updated_at = "2024-01-01T00:00:00"

    # Mock DB execution
    mock_result_set = MagicMock()
    mock_result_set.scalars.return_value.all.return_value = [mock_company]
    
    # For count query
    mock_count_res = MagicMock()
    mock_count_res.scalar.return_value = 1
    
    mock_db.execute.side_effect = [mock_count_res, mock_result_set]

    response = await async_client.get("/api/v1/companies")
    
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) == 1
    assert data["data"][0]["name"] == "Test Company"
    assert data["meta"]["total"] == 1

    # Cleanup
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_company_success(async_client, mock_db, mock_user):
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    mock_company = MagicMock(spec=Company)
    mock_company.ueid = "UEID-123"
    mock_company.name = "Test Company"
    mock_company.edrpou = "12345678"
    mock_company.status = "active"
    mock_company.sector = "Tech"
    mock_company.risk_score = 45.5
    mock_company.cers_confidence = 0.95
    mock_company.created_at = "2024-01-01T00:00:00"
    mock_company.updated_at = "2024-01-01T00:00:00"

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_company
    
    # Mock RiskScore
    mock_score = MagicMock()
    mock_score.behavioral_score = 75.0
    mock_score.institutional_score = 80.0
    mock_score.influence_score = 60.0
    mock_score.structural_score = 40.0
    mock_score.predictive_score = 50.0
    
    mock_score_res = MagicMock()
    mock_score_res.scalar_one_or_none.return_value = mock_score
    
    # Side effects for multiple execute calls
    mock_db.execute.side_effect = [mock_result, mock_score_res]

    response = await async_client.get("/api/v1/companies/UEID-123")
    
    assert response.status_code == 200
    data = response.json()
    assert data["ueid"] == "UEID-123"
    assert data["risk_details"]["behavioral"]["value"] == 75.0
    assert data["risk_level"] == "elevated"

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_company_not_found(async_client, mock_db, mock_user):
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    response = await async_client.get("/api/v1/companies/NONEXISTENT")
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Компанію не знайдено"

    app.dependency_overrides.clear()
