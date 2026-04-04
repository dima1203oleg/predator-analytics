
from httpx import ASGITransport, AsyncClient
import pytest

from app.core.security import get_current_user_payload
from app.dependencies import get_tenant_id
from app.main import app


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
        "permissions": ["read_corp_data", "run_analytics"]
    }

@pytest.mark.asyncio
async def test_get_edr_company_success(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    # Permission check mock
    from app.dependencies import PermissionChecker
    app.dependency_overrides[PermissionChecker] = lambda *args, **kwargs: lambda: True

    response = await async_client.get("/api/v1/ukraine-registries/edr/company/12345678")
    assert response.status_code == 200
    data = response.json()
    assert data["edrpou"] == "12345678"
    assert "name" in data
    assert "status" in data

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_search_edr_companies(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    payload = {
        "name": "Тест",
        "limit": 10
    }
    response = await async_client.post("/api/v1/ukraine-registries/edr/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_check_vat_status(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    response = await async_client.get("/api/v1/ukraine-registries/vat/12345678")
    assert response.status_code == 200
    data = response.json()
    assert "is_vat_payer" in data
    assert data["edrpou"] == "12345678"

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_check_debtor_status(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    response = await async_client.get("/api/v1/ukraine-registries/debtors/12345678")
    assert response.status_code == 200
    data = response.json()
    assert "has_debt" in data
    assert "total_debt" in data

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_search_court_cases(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    payload = {
        "party_edrpou": "12345678",
        "limit": 10
    }
    response = await async_client.post("/api/v1/ukraine-registries/court/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "cases" in data
    assert "total" in data

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_search_prozorro_tenders(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    payload = {
        "participant_edrpou": "12345678"
    }
    response = await async_client.post("/api/v1/ukraine-registries/prozorro/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "tenders" in data
    assert "total" in data

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_check_sanctions(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    payload = {
        "name": "Іванов Іван Іванович",
        "edrpou": "12345678"
    }
    response = await async_client.post("/api/v1/ukraine-registries/sanctions/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "is_sanctioned" in data
    assert "matches" in data

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_investigate_company(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    response = await async_client.get("/api/v1/ukraine-registries/investigate/company/12345678")
    assert response.status_code == 200
    data = response.json()
    assert data["edrpou"] == "12345678"
    assert "sections" in data
    assert "risk_indicators" in data

    app.dependency_overrides.clear()
