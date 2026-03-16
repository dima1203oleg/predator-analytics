import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch, MagicMock
from app.main import app
from app.core.security import get_current_user_payload
from app.database import get_db
from app.dependencies import get_tenant_id
from app.core.permissions import Permission
from predator_common.models import Company, RiskScore
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
async def test_get_graph_summary(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.scalar = AsyncMock(return_value=10)
    
    mock_score = MagicMock(spec=RiskScore)
    mock_score.entity_ueid = "entity-1"
    mock_score.entity_type = "company"
    mock_score.cers = 80
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_score]
    mock_db.execute = AsyncMock(return_value=mock_result)

    response = await async_client.get("/api/v1/graph/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["total_nodes"] == 10
    assert len(data["nodes"]) == 1

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_entity_neighbors(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    with patch("app.routers.graph.graph_db") as mock_graph:
        mock_graph.run_query = AsyncMock(return_value=[{"n": "node1", "r": "rel", "m": "node2"}])
        
        response = await async_client.get("/api/v1/graph/entity123/neighbors")
        assert response.status_code == 200
        assert len(response.json()) == 1

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_shadow_map(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    with patch("app.routers.graph.graph_db") as mock_graph:
        mock_graph.run_query = AsyncMock(return_value=[{"n": "node1", "m": "node2"}])
        
        response = await async_client.get("/api/v1/graph/shadow/entity123")
        assert response.status_code == 200
        assert len(response.json()) == 1

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_cartels(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    response = await async_client.get("/api/v1/graph/clusters/cartels")
    assert response.status_code == 200
    assert response.json()["status"] == "analysis_pending"

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_beneficiaries(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    with patch("app.routers.graph.graph_db") as mock_graph:
        mock_graph.run_query = AsyncMock(return_value=[{"u": "Person1"}])
        
        response = await async_client.get("/api/v1/graph/entities/ubo/entity123")
        assert response.status_code == 200
        assert len(response.json()) == 1

    app.dependency_overrides.clear()
