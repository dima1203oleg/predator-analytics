from collections.abc import AsyncGenerator

from httpx import ASGITransport, AsyncClient
import pytest

from app.config import get_settings
from app.main import app


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    # ASGITransport for testing FastAPI app without starting the server
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient) -> None:
    response = await async_client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == get_settings().APP_VERSION


@pytest.mark.asyncio
async def test_metrics_endpoint(async_client: AsyncClient) -> None:
    response = await async_client.get("/metrics")
    assert response.status_code == 200
    assert "HELP request_count" in response.text
