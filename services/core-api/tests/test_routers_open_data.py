from httpx import AsyncClient
import pytest

from app.main import app


@pytest.mark.asyncio
async def test_open_data_status():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/open-data/status")

        # Test basic success since the router mock data returns 200
        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        assert "ckan" in data["services"]
        assert "prozorro" in data["services"]
        assert "edr" in data["services"]
        assert data["services"]["ckan"]["status"] == "online"

@pytest.mark.asyncio
async def test_prozorro_search():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/open-data/prozorro/search?query=test")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["results"]) == 3
        assert data["results"][0]["type"] == "TENDER"

@pytest.mark.asyncio
async def test_ownership_graph():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Request for existing mock data
        response = await ac.get("/api/v1/graph/ownership/04362489")
        assert response.status_code == 200
        data = response.json()
        assert data["root_edrpou"] == "04362489"
        assert len(data["nodes"]) == 6
        assert len(data["edges"]) == 5

        # Request for non-existent edrpou
        response_empty = await ac.get("/api/v1/graph/ownership/11111111")
        assert response_empty.status_code == 200
        empty_data = response_empty.json()
        assert empty_data["root_edrpou"] == "11111111"
        assert "message" in empty_data

@pytest.mark.asyncio
async def test_company_risks():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/graph/ownership/04362489/risks")
        assert response.status_code == 200
        data = response.json()
        assert data["edrpou"] == "04362489"
        assert data["risk_score"] == 15
        assert len(data["indicators"]) == 4

@pytest.mark.asyncio
async def test_company_tenders():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/graph/ownership/04362489/tenders")
        assert response.status_code == 200
        data = response.json()
        assert data["edrpou"] == "04362489"
        assert data["role"] == "procuring_entity"
        assert data["total_tenders"] == 45
