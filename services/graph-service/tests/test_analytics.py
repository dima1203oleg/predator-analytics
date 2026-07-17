import pytest
from fastapi.testclient import TestClient
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)

# Дані для мокування GraphDatabase
MOCK_UEID = "12345678"
MOCK_COMPANY_NAME = "Test Company LLC"


def test_fraud_rings():
    """Тестування ендпоінту виявлення циклічних зв'язків (фрод-кілець)."""
    # Оскільки Neo4j безпосередньо інтегрований у роутер, а мокування
    # вимагає monkeypatching Neo4j driver, для e2e тесту ми перевіряємо
    # відповідь сервісу (або обробку помилки відсутності підключення)
    
    response = client.get("/api/v1/graph/fraud_rings?limit=5")
    
    # Залежно від стану Neo4j (якщо його немає в тестовому середовищі), 
    # FastAPI має повернути 503 Service Unavailable або 200 OK з пустим масивом
    assert response.status_code in (200, 503)
    
    if response.status_code == 200:
        data = response.json()
        assert "fraud_rings" in data
        assert isinstance(data["fraud_rings"], list)


def test_sanctions_exposure():
    """Тестування ендпоінту перевірки зв'язків із підсанкційними сутностями."""
    response = client.get(f"/api/v1/graph/sanctions_exposure?ueid={MOCK_UEID}")
    
    assert response.status_code in (200, 503)
    
    if response.status_code == 200:
        data = response.json()
        assert "sanctions_exposure" in data
        assert isinstance(data["sanctions_exposure"], list)


def test_influence_score():
    """Тестування ендпоінту оцінки індексу впливу компанії."""
    response = client.get(f"/api/v1/graph/influence_score?ueid={MOCK_UEID}")
    
    assert response.status_code in (200, 503)
    
    if response.status_code == 200:
        data = response.json()
        assert "ueid" in data
        assert data["ueid"] == MOCK_UEID
        assert "total_influence_score" in data
        assert isinstance(data["total_influence_score"], float)
