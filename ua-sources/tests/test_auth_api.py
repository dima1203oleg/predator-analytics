"""
Tests for Auth API endpoints (TS-Compliant)
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/profile
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class MockAsyncpgConnection:
    """Mock asyncpg connection for testing"""
    
    def __init__(self):
        self.user_id_counter = 1
        self.users = {}
    
    async def fetchrow(self, query, *args):
        if "SELECT id FROM gold.users WHERE email" in query:
            email = args[0]
            return self.users.get(email)
        elif "SELECT id, email, password_hash" in query:
            email = args[0]
            if email in self.users:
                return {
                    "id": self.users[email]["id"],
                    "email": email,
                    "password_hash": self.users[email]["password_hash"],
                    "role": "user",
                    "subscription_level": "free"
                }
        elif "SELECT id, email, username" in query:
            user_id = args[0]
            for email, user in self.users.items():
                if user["id"] == user_id:
                    return {
                        "id": user_id,
                        "email": email,
                        "username": user.get("username", "test"),
                        "role": "user",
                        "subscription_level": "free",
                        "can_view_pii": False,
                        "created_at": "2025-01-01T00:00:00"
                    }
        return None
    
    async def fetchval(self, query, *args):
        if "INSERT INTO gold.users" in query:
            email = args[0]
            password_hash = args[1]
            self.users[email] = {
                "id": self.user_id_counter,
                "password_hash": password_hash,
                "username": args[2]
            }
            self.user_id_counter += 1
            return self.users[email]["id"]
        return None
    
    async def execute(self, query, *args):
        pass
    
    async def close(self):
        pass


mock_conn = MockAsyncpgConnection()


async def mock_get_db_connection():
    return mock_conn


@pytest.fixture
def client():
    """Create test client with mocked database"""
    with patch('app.api.routers.auth.get_db_connection', mock_get_db_connection):
        from app.main_v21 import app
        with TestClient(app) as test_client:
            yield test_client


class TestAuthRegister:
    """Tests for POST /api/v1/auth/register"""
    
    def test_register_success(self, client):
        """Test successful user registration"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@test.com",
                "password": "securepassword123",
                "name": "New User"
            }
        )
        
        # Should return 201 Created
        assert response.status_code == 201
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["email"] == "newuser@test.com"
        assert data["role"] == "user"
        assert data["expires_in"] == 86400  # 24 hours
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email format"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "password123"
            }
        )
        
        # Should return 422 Validation Error
        assert response.status_code == 422
    
    def test_register_missing_password(self, client):
        """Test registration without password"""
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "test@test.com"}
        )
        
        assert response.status_code == 422


class TestAuthLogin:
    """Tests for POST /api/v1/auth/login"""
    
    def test_login_success(self, client):
        """Test successful login after registration"""
        # First register
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "logintest@test.com",
                "password": "mypassword123"
            }
        )
        
        # Then login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "logintest@test.com",
                "password": "mypassword123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["email"] == "logintest@test.com"
    
    def test_login_wrong_password(self, client):
        """Test login with wrong password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "logintest@test.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent email"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nobody@nowhere.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 401


class TestAuthProfile:
    """Tests for GET /api/v1/auth/profile"""
    
    def test_profile_with_valid_token(self, client):
        """Test getting profile with valid JWT"""
        # Register and get token
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "profiletest@test.com",
                "password": "password123",
                "name": "Profile User"
            }
        )
        
        token = register_response.json()["access_token"]
        
        # Get profile
        response = client.get(
            "/api/v1/auth/profile",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "profiletest@test.com"
        assert "user_id" in data
        assert "role" in data
    
    def test_profile_without_token(self, client):
        """Test profile endpoint without authorization"""
        response = client.get("/api/v1/auth/profile")
        
        assert response.status_code == 401
    
    def test_profile_with_invalid_token(self, client):
        """Test profile with invalid JWT"""
        response = client.get(
            "/api/v1/auth/profile",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        
        assert response.status_code == 401
