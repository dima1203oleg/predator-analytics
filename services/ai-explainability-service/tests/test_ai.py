from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ai-explainability"}

def test_explain_endpoint():
    payload = {"entity_id": "offshore1", "context_data": {"country": "panama"}}
    response = client.post("/api/v1/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data
    assert "confidence" in data
    assert "chain" in data
    assert len(data["chain"]) > 0
