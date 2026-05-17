"""🧪 Тести для інтеграційних endpoints реєстрів України.
"""

from httpx import ASGITransport, AsyncClient
import pytest

from app.main import app


@pytest.fixture
async def async_client():
    """Фікстура асинхронного тестового клієнта."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture(autouse=True)
def setup_security_and_permission_overrides():
    """Автоматичний фікстурний запуск перекриття засобів безпеки FastAPI."""
    from app.core.security import get_current_user_payload
    from app.dependencies import get_tenant_id

    mock_user = {
        "sub": "user-123",
        "role": "vip",
        "tenant_id": "test-tenant",
        "permissions": ["read:corp_data", "run:analytics"]
    }

    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    yield

    app.dependency_overrides.clear()



@pytest.mark.asyncio
async def test_get_edr_company_success(async_client) -> None:
    response = await async_client.get("/api/v1/ukraine-registries/edr/company/12345678")
    assert response.status_code == 200
    data = response.json()
    assert data["edrpou"] == "12345678"
    assert "name" in data
    assert "status" in data


@pytest.mark.asyncio
async def test_search_edr_companies(async_client) -> None:
    payload = {
        "name": "Тест",
        "limit": 10
    }
    response = await async_client.post("/api/v1/ukraine-registries/edr/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_check_vat_status(async_client) -> None:
    response = await async_client.get("/api/v1/ukraine-registries/vat/12345678")
    assert response.status_code == 200
    data = response.json()
    assert "is_vat_payer" in data
    assert data["edrpou"] == "12345678"


@pytest.mark.asyncio
async def test_check_debtor_status(async_client) -> None:
    response = await async_client.get("/api/v1/ukraine-registries/debtors/12345678")
    assert response.status_code == 200
    data = response.json()
    assert "has_debt" in data
    assert "total_debt" in data


@pytest.mark.asyncio
async def test_search_court_cases(async_client) -> None:
    payload = {
        "party_edrpou": "12345678",
        "limit": 10
    }
    response = await async_client.post("/api/v1/ukraine-registries/court/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "cases" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_search_prozorro_tenders(async_client) -> None:
    payload = {
        "participant_edrpou": "12345678"
    }
    response = await async_client.post("/api/v1/ukraine-registries/prozorro/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "tenders" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_check_sanctions(async_client) -> None:
    payload = {
        "name": "Іванов Іван Іванович",
        "edrpou": "12345678"
    }
    response = await async_client.post("/api/v1/ukraine-registries/sanctions/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "is_sanctioned" in data
    assert "matches" in data


@pytest.mark.asyncio
async def test_investigate_company(async_client) -> None:
    response = await async_client.get("/api/v1/ukraine-registries/investigate/company/12345678")
    assert response.status_code == 200
    data = response.json()
    assert data["edrpou"] == "12345678"
    assert "sections" in data
    assert "risk_indicators" in data
