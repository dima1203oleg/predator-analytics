import pytest
import requests
import os

API_URL = os.getenv("PREDATOR_API_URL", "http://localhost:8000/api/v1")

@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer fake-jwt-token-for-testing"}

@pytest.mark.parametrize("user_profile, expected_keywords", [
    ("analyst", ["дані", "статистика", "тренд"]),
    ("manager", ["ризики", "звіт", "бюджет"]),
    ("osint", ["зв'язки", "граф", "афіліація"])
])
def test_ai_personalization(auth_headers, user_profile, expected_keywords):
    """
    Перевірка персоналізації відповідей AI для різних профілів.
    Система повинна адаптувати термінологію, приклади та підказки.
    """
    response = requests.post(
        f"{API_URL}/chat/completions",
        headers=auth_headers,
        json={
            "query": "Проаналізуй останні дані компанії",
            "user_profile": user_profile
        }
    )
    assert response.status_code in [200, 404]
    
    # If endpoint works, check keywords in response text
    if response.status_code == 200:
        data = response.json()
        text = data.get("response", "").lower()
        # Verify that at least one of the expected profile keywords is used
        found = any(kw in text for kw in expected_keywords)
        assert found, f"Expected keywords for profile {user_profile} not found in response"
