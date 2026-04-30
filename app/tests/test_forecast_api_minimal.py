from __future__ import annotations

from fastapi.testclient import TestClient
import pytest

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_forecast_models_endpoint_exists(client):
    response = client.get("/api/v1/forecast/models")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("models"), list)
    assert any(m.get("key") == "prophet" for m in data["models"])


def test_forecast_demand_endpoint_exists(client):
    payload = {"product_code": "84713000", "months_ahead": 3, "model": "prophet"}
    response = client.post("/api/v1/forecast/demand", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "source" in data
    assert data["source"] in {"real", "synthetic"}
    assert "product_code" in data
    assert "forecast" in data
