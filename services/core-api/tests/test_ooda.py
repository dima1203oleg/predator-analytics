import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import get_current_user_payload

mock_user = {
    "sub": "test-user-id",
    "tenant_id": "test-tenant",
    "role": "admin"
}

@pytest.fixture
def test_app():
    with patch("app.core.auth_middleware.jwks_client", None):
        app.dependency_overrides[get_current_user_payload] = lambda: mock_user
        yield app
        app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_ooda_status(test_app):
    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/ooda/status", headers={"Authorization": "Bearer test-token"})
        assert response.status_code == 200
        
        data = response.json()
        assert "timestamp" in data
        assert "cycle_time_ms" in data
        assert "phases" in data
        assert "alerts" in data
        
        phases = data["phases"]
        for phase in ["observe", "orient", "decide", "act", "feedback"]:
            assert phase in phases
            assert "latency_ms" in phases[phase]
            assert "health" in phases[phase]
