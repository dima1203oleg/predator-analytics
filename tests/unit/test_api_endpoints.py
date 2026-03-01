"""
Unit Tests for Predator API
"""

import pytest
from fastapi.testclient import TestClient
from services.api.main import app

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["system"] == "Predator Analytics"


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_dashboard_analytics():
    response = client.get("/v1/analytics/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "daily_active_users" in data
