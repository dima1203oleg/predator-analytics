import pytest
import requests
import os

API_URL = os.getenv("PREDATOR_API_URL", "http://localhost:8000/api/v1")

@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer fake-jwt-token-for-testing"}

def test_sql_injection_attempt():
    """Перевірка стійкості до SQL Injection на етапі логіну"""
    response = requests.post(
        f"{API_URL}/auth/login",
        json={"username": "admin' OR '1'='1", "password": "password"}
    )
    # The system should properly escape or use parameterized queries, resulting in 401 or 404, not 500
    assert response.status_code in [401, 404, 403, 400]

def test_path_traversal(auth_headers):
    """Перевірка стійкості до Path Traversal при завантаженні/запиті файлів"""
    response = requests.get(
        f"{API_URL}/files/download?path=../../../etc/passwd",
        headers=auth_headers
    )
    # The system should reject this
    assert response.status_code in [400, 403, 404]

def test_xss_in_chat(auth_headers):
    """Перевірка стійкості до XSS у вхідних даних (AI Chat)"""
    response = requests.post(
        f"{API_URL}/chat/completions",
        headers=auth_headers,
        json={"query": "<script>alert(1)</script>", "user_profile": "admin"}
    )
    # Chat should process it normally or escape it, status 200 or 400
    assert response.status_code in [200, 400, 404]

def test_broken_access_control():
    """Перевірка доступу до захищених ресурсів без токену"""
    response = requests.get(f"{API_URL}/admin/users")
    assert response.status_code in [401, 403]
