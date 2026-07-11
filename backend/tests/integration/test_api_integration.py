import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_risk_assessment_endpoint():
    response = client.post("/api/risk/assess", json={"company_id": "test_123"})
    assert response.status_code == 200
    assert "risk_score" in response.json()