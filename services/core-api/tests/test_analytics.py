import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.core.security import get_current_user_payload
from app.dependencies import get_tenant_id

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

@pytest.mark.asyncio
async def test_calculate_aml_score_success(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    # We need to mock the service method as it doesn't use the DB directly but might call other services
    # For now, let's just test the endpoint logic
    payload = {
        "entity_id": "12345678",
        "entity_name": "ТОВ Тест",
        "entity_type": "organization",
        "data": {
            "sanctions": {"is_sanctioned": True, "reason": "Test reason"},
            "tax": {"debt_amount": 2000000}
        }
    }

    response = await async_client.post("/api/v1/analytics/aml/score", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["entity_id"] == "12345678"
    assert data["total_score"] > 0
    assert any(f["category"] == "sanctions" and f["detected"] for f in data["factors"])

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_risk_levels(async_client):
    response = await async_client.get("/api/v1/analytics/aml/risk-levels")
    assert response.status_code == 200
    data = response.json()
    assert "levels" in data
    assert "factors" in data

@pytest.mark.asyncio
async def test_analyze_time_series(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    payload = {
        "data": [
            {"timestamp": "2024-01-01T10:00:00", "value": 100},
            {"timestamp": "2024-01-02T10:00:00", "value": 110},
            {"timestamp": "2024-01-03T10:00:00", "value": 500}, # Anomaly
            {"timestamp": "2024-01-04T10:00:00", "value": 105}
        ],
        "method": "zscore"
    }

    response = await async_client.post("/api/v1/analytics/anomaly/time-series", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "anomalies" in data
    assert data["total_points"] == 4

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_patterns_catalog(async_client):
    response = await async_client.get("/api/v1/analytics/anomaly/patterns-catalog")
    assert response.status_code == 200
    assert "patterns" in response.json()
