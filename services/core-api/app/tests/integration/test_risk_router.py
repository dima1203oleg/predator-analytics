import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.risk import RiskAssessment
from app.services.risk.risk_service import RiskService

client = TestClient(app)

@pytest.fixture
def mock_risk_service(mocker):
    mock = mocker.patch("app.services.risk.risk_service.RiskService")
    mock.return_value.assess_risk.return_value = RiskAssessment(
        company_id=1,
        risk_score=0.75,
        risk_level="high"
    )
    return mock

def test_assess_risk_success(mock_risk_service):
    response = client.post("/api/risk/assess", json={"company_id": 1})
    assert response.status_code == 200
    assert response.json() == {
        "company_id": 1,
        "risk_score": 0.75,
        "risk_level": "high"
    }

def test_assess_risk_invalid_input():
    response = client.post("/api/risk/assess", json={"company_id": "invalid"})
    assert response.status_code == 422