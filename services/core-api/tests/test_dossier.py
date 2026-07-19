import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app

HEADERS = {"Authorization": "Bearer test-token"}

@pytest.mark.asyncio
async def test_compile_dossier_person():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "entity_type": "person",
            "identifier": "3111710115",
            "name": "Кізима Дмитро Миколайович",
            "classification_levels": ["WHITE", "GREY"]
        }
        response = await ac.post("/api/v1/dossier/compile", json=payload, headers=HEADERS)
        
        assert response.status_code == 200
        data = response.json()
        assert data["entity_type"] == "person"
        assert data["identifier"] == "3111710115"
        assert "risk_assessment" in data
        assert "sections" in data
        assert isinstance(data["sections"], dict)

@pytest.mark.asyncio
async def test_compile_dossier_company():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "entity_type": "company",
            "identifier": "04362489",
            "name": "Нафтогаз",
            "classification_levels": ["WHITE"]
        }
        response = await ac.post("/api/v1/dossier/compile", json=payload, headers=HEADERS)
        
        assert response.status_code == 200
        data = response.json()
        assert data["entity_type"] == "company"
        assert data["identifier"] == "04362489"
        assert "risk_assessment" in data
        assert "sections" in data

@pytest.mark.asyncio
async def test_list_collectors():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/dossier/collectors", headers=HEADERS)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "name" in data[0]
        assert "classification" in data[0]
