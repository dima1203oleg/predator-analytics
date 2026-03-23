from httpx import AsyncClient
import pytest


@pytest.mark.asyncio
async def test_health_alias(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200

    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["mode"] == "testing"


@pytest.mark.asyncio
async def test_system_status(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/v1/system/status")
    assert response.status_code == 200

    payload = response.json()
    assert payload["healthy"] is True
    assert payload["summary"]["healthy"] >= 1
    assert isinstance(payload["services"], list)


@pytest.mark.asyncio
async def test_system_stats_alias(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/v1/stats/system")
    assert response.status_code == 200

    payload = response.json()
    assert "cpu_percent" in payload
    assert "memory_percent" in payload
    assert "uptime" in payload


@pytest.mark.asyncio
async def test_system_diagnostics(async_client: AsyncClient) -> None:
    response = await async_client.post("/api/v1/system/diagnostics/run")
    assert response.status_code == 200

    payload = response.json()
    assert payload["status"] == "success"
    assert payload["results"]["overall_status"] == "В НОРМІ"
    assert "report_markdown" in payload
