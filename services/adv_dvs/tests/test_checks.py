"""ADV DVS: Unit Tests for Checks."""
import pytest
from unittest.mock import patch, MagicMock

from services.adv_dvs.checks.redis_check import check_redis
from services.adv_dvs.checks.db_check import check_postgres

@pytest.mark.asyncio
@patch('services.adv_dvs.checks.redis_check.redis.from_url')
async def test_check_redis_success(mock_from_url):
    """Тест успішного підключення до Redis."""
    # Мок клієнта Redis
    mock_client = MagicMock()
    mock_from_url.return_value = mock_client
    
    # Виклик функції
    result = await check_redis()
    
    assert result["status"] == "passed"
    assert result["component"] == "redis"
    mock_client.ping.assert_called_once()
    mock_client.aclose.assert_called_once()

@pytest.mark.asyncio
@patch('services.adv_dvs.checks.db_check.asyncpg.connect')
async def test_check_postgres_success(mock_connect):
    """Тест успішного підключення до PostgreSQL."""
    mock_conn = MagicMock()
    mock_connect.return_value = mock_conn
    
    result = await check_postgres()
    
    assert result["status"] == "passed"
    assert result["component"] == "postgres"
    mock_conn.execute.assert_called_once_with("SELECT 1")
    mock_conn.close.assert_called_once()
