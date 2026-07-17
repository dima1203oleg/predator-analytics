import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import get_current_user_payload

client = TestClient(app)

MOCK_UEID = "12345678"



# Mock User
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

@pytest.fixture
def mock_ch_client(mocker):
    # Мокаємо ClickHouse клієнт
    mock = MagicMock()
    mocker.patch("app.routers.tenders._get_clickhouse_client", return_value=mock)
    return mock

def test_get_company_tenders(test_app, mock_ch_client):
    mock_summary_result = MagicMock()
    mock_summary_result.row_count = 1
    mock_summary_result.first_row = (10, 50000.0, 5, 5000.0)
    
    mock_currency_result = MagicMock()
    mock_currency_result.result_rows = [("UAH", 50000.0)]
    
    mock_monthly_result = MagicMock()
    mock_monthly_result.result_rows = [("2024-01-01", 10, 50000.0)]
    
    def query_side_effect(query, parameters=None):
        if "count() AS total_tenders" in query:
            return mock_summary_result
        elif "currency," in query:
            return mock_currency_result
        else:
            return mock_monthly_result
            
    mock_ch_client.query.side_effect = query_side_effect
    
    response = client.get("/api/v1/analytics/company/12345678/tenders?limit=5", headers={"Authorization": "Bearer test-token"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["ueid"] == "12345678"
    assert data["data"]["total_tenders"] == 10
    
def test_get_top_spenders(test_app, mock_ch_client):
    # Setup mock
    mock_ch_client.query.return_value.result_rows = [
        ("12345678", "Buyer A", 1, 50000.0, 50000.0),
        ("87654321", "Buyer B", 2, 25000.0, 12500.0)
    ]
    
    response = client.get("/api/v1/analytics/tenders/top_spenders?limit=2", headers={"Authorization": "Bearer test-token"})
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["top_spenders"]) == 2
    assert data["top_spenders"][0]["procuring_entity_name"] == "Buyer A"
    assert data["top_spenders"][0]["total_spent"] == 50000.0
    
def test_clickhouse_unavailable(test_app, mocker):
    mocker.patch("app.routers.tenders._get_clickhouse_client", return_value=None)
    
    response = client.get("/api/v1/analytics/company/12345678/tenders?limit=5", headers={"Authorization": "Bearer test-token"})
    
    assert response.status_code == 503
    assert "ClickHouse недоступний" in response.json()["detail"]
