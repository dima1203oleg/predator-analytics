import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_ooda_status():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/ooda/status")
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
