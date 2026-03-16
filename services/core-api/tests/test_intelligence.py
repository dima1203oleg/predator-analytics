import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch, MagicMock
from app.main import app
from app.core.security import get_current_user_payload
from app.database import get_db
from app.dependencies import get_tenant_id
from app.core.permissions import Permission
from predator_common.models import Company, RiskScore, Anomaly
from datetime import datetime, UTC

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
        "permissions": ["read_corp_data", "run_graph", "read_intel"]
    }

@pytest.fixture
def mock_db():
    return AsyncMock()

@pytest.mark.asyncio
async def test_generate_entity_report_success(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    # Mock get_company, get_shadow_map, get_beneficiaries (internal calls)
    with patch("app.routers.intelligence.get_company", AsyncMock(return_value={"name": "Test Company", "risk_details": "low"})):
        with patch("app.routers.intelligence.get_shadow_map", AsyncMock(return_value=[])):
            with patch("app.routers.intelligence.get_beneficiaries", AsyncMock(return_value=[])):
                with patch("app.services.ai_service.AIService.generate_insight", AsyncMock(return_value="Detailed Report Content")):
                    
                    response = await async_client.get("/api/v1/intelligence/report/company-123")
                    assert response.status_code == 200
                    data = response.json()
                    assert data["status"] == "ready"
                    assert data["report"] == "Detailed Report Content"

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_analyze_cartel_cluster(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    with patch("app.services.ai_service.AIService.generate_insight", AsyncMock(return_value="Cartel insight")):
        # The endpoint expects cluster_id and entities as query parameters based on 422 error with body
        response = await async_client.post(
            "/api/v1/intelligence/analyze/cluster",
            params={"cluster_id": "cluster-1", "entities": ["e1", "e2"]}
        )
        assert response.status_code == 200
        assert response.json()["insight"] == "Cartel insight"

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_morning_briefing(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch("app.services.axiom_verifier.AxiomVerifier.verify_data_consistency", AsyncMock(return_value={"purity": 99})):
        mock_db.scalar = AsyncMock(side_effect=[5, 100, 2]) # risks_count, entities_count, anomalies_count
        
        with patch("app.services.ai_service.AIService.generate_insight", AsyncMock(return_value="Morning report content")):
            response = await async_client.get("/api/v1/intelligence/morning-brief")
            assert response.status_code == 200
            data = response.json()
            assert data["title"] == "Sovereign Daily Brief"
            assert data["metrics"]["risks_detected"] == 5
            assert data["report"] == "Morning report content"

    app.dependency_overrides.clear()
