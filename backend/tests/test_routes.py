import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, AsyncMock, patch
from app.main import app
from app.services.ua_sources import ua_sources
from app.services.llm_router import llm_router

client = TestClient(app)

@pytest.mark.asyncio
async def test_dashboard_overview():
    # Mock ua_sources.get_usd_rate
    with patch.object(ua_sources, 'get_usd_rate', new_callable=AsyncMock) as mock_rate:
        mock_rate.return_value = 42.0
        
        response = client.get("/api/v1/dashboard/overview")
        assert response.status_code == 200
        data = response.json()
        assert data["metrics"]["usdRate"] == 42.0
        assert data["status"] == "OPERATIONAL"

@pytest.mark.asyncio
async def test_search_companies_route():
    with patch.object(ua_sources, 'search_companies', new_callable=AsyncMock) as mock_search:
        mock_search.return_value = [{"name": "Test Co", "edrpou": "123"}]
        
        response = client.get("/api/v1/sources/companies?q=Test")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Co"

@pytest.mark.asyncio
async def test_opponent_ask_route():
    # Mock ua_sources.deep_scan
    # Mock llm_router.generate
    
    mock_scan_result = {
        "query": "Test",
        "sources": [{"type": "EDR", "name": "EDR", "count": 1, "data": [{"name": "Test Co"}]}],
        "riskScore": 0.1,
        "findings": []
    }
    
    mock_llm_response = MagicMock()
    mock_llm_response.success = True
    mock_llm_response.content = "Analysis result"
    mock_llm_response.model = "gpt-4"
    
    with patch.object(ua_sources, 'deep_scan', new_callable=AsyncMock) as mock_scan, \
         patch.object(llm_router, 'generate', new_callable=AsyncMock) as mock_llm:
        
        mock_scan.return_value = mock_scan_result
        mock_llm.return_value = mock_llm_response
        
        payload = {"query": "Test Company", "sector": "GOV"}
        response = client.post("/api/v1/opponent/ask", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["answer"] == "Analysis result"
        assert len(data["sources"]) == 1
