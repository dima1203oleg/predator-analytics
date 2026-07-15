"""🧪 Тести для OSINT endpoints.
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
        "tenant_id": "00000000-0000-0000-0000-000000000000",
        "permissions": ["read:corp_data", "run:analytics"]
    }

    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "00000000-0000-0000-0000-000000000000"

    yield

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_osint_tools(async_client) -> None:
    response = await async_client.get("/api/v1/osint/tools")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "id" in data[0]

@pytest.mark.asyncio
async def test_get_osint_stats(async_client) -> None:
    response = await async_client.get("/api/v1/osint/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_records" in data
    assert "high_risk_found" in data

@pytest.mark.asyncio
async def test_get_osint_feed(async_client) -> None:
    response = await async_client.get("/api/v1/osint/feed")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
