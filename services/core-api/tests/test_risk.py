from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

from httpx import ASGITransport, AsyncClient
import pytest

from app.core.security import get_current_user_payload
from app.database import get_db
from app.dependencies import get_tenant_id
from app.main import app
from predator_common.models import Company, RiskScore


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
        "permissions": ["read_companies"]
    }

@pytest.fixture
def mock_db():
    return AsyncMock()

@pytest.mark.asyncio
async def test_get_risk_scores_success(async_client, mock_user, mock_db):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"
    app.dependency_overrides[get_db] = lambda: mock_db

    ueid = "comp-123"

    mock_company = MagicMock(spec=Company)
    mock_company.ueid = ueid
    mock_company.name = "Test Company"
    mock_company.tenant_id = "test-tenant"

    mock_risk_score = MagicMock(spec=RiskScore)
    mock_risk_score.entity_ueid = ueid
    mock_risk_score.tenant_id = "test-tenant"
    mock_risk_score.cers = 45.0
    mock_risk_score.cers_confidence = 0.9
    mock_risk_score.behavioral_score = 40.0
    mock_risk_score.institutional_score = 50.0
    mock_risk_score.influence_score = 30.0
    mock_risk_score.structural_score = 60.0
    mock_risk_score.predictive_score = 45.0
    mock_risk_score.flags = [{"driver": "Tax Debt", "contribution": 15.0}]
    mock_risk_score.score_date = datetime.now(UTC)

    # Mock DB executions
    mock_db.execute.side_effect = [
        MagicMock(scalars=lambda: MagicMock(all=lambda: [mock_company])),
        MagicMock(scalars=lambda: MagicMock(all=lambda: [mock_risk_score]))
    ]

    response = await async_client.get(f"/api/v1/risk/score?entities={ueid}")

    assert response.status_code == 200
    data = response.json()
    assert len(data["scores"]) == 1
    assert data["scores"][0]["entity_ueid"] == ueid
    assert data["scores"][0]["cers"] == 45.0
    assert data["scores"][0]["interpretation"] == "Підвищений ризик (Elevated)"

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_risk_scores_empty(async_client, mock_user):
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    response = await async_client.get("/api/v1/risk/score?entities=")
    # FastAPI might return 422 if entities is required non-empty string,
    # but the code handles if not ueids raise 400.
    assert response.status_code in (400, 422)

    app.dependency_overrides.clear()
