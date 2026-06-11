"""
Тести для ADV-DVS перевірок.
Використовується pytest + pytest-asyncio.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from services.adv_dvs.models import CheckStatus
from services.adv_dvs.checks import frontend_check, backend_check, redis_check, db_check


# ─── Frontend ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_frontend_check_ok() -> None:
    """Симулює HTTP 200 від Frontend → очікуємо OK."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200

    with patch("services.adv_dvs.checks.frontend_check.httpx.AsyncClient") as MockClient:
        MockClient.return_value.__aenter__ = AsyncMock(return_value=MockClient.return_value)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value.get = AsyncMock(return_value=mock_resp)

        result = await frontend_check.run()

    assert result.name == "frontend"
    assert result.status == CheckStatus.OK


@pytest.mark.asyncio
async def test_frontend_check_fail() -> None:
    """Симулює мережеву помилку Frontend → очікуємо FAIL."""
    with patch("services.adv_dvs.checks.frontend_check.httpx.AsyncClient") as MockClient:
        MockClient.return_value.__aenter__ = AsyncMock(return_value=MockClient.return_value)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value.get = AsyncMock(side_effect=Exception("Connection refused"))

        result = await frontend_check.run()

    assert result.status == CheckStatus.FAIL
    assert "Connection refused" in (result.details or "")


# ─── Backend ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_backend_check_ok() -> None:
    """Симулює HTTP 200 від Backend → очікуємо OK."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200

    with patch("services.adv_dvs.checks.backend_check.httpx.AsyncClient") as MockClient:
        MockClient.return_value.__aenter__ = AsyncMock(return_value=MockClient.return_value)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value.get = AsyncMock(return_value=mock_resp)

        result = await backend_check.run()

    assert result.name == "backend"
    assert result.status == CheckStatus.OK


@pytest.mark.asyncio
async def test_backend_check_fail_http_500() -> None:
    """Симулює HTTP 500 від Backend → очікуємо FAIL."""
    mock_resp = MagicMock()
    mock_resp.status_code = 500

    with patch("services.adv_dvs.checks.backend_check.httpx.AsyncClient") as MockClient:
        MockClient.return_value.__aenter__ = AsyncMock(return_value=MockClient.return_value)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value.get = AsyncMock(return_value=mock_resp)

        result = await backend_check.run()

    assert result.status == CheckStatus.FAIL


# ─── Redis ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_redis_check_ok() -> None:
    """Симулює Redis PING → True → очікуємо OK."""
    with patch("services.adv_dvs.checks.redis_check.aioredis.from_url") as mock_from_url:
        mock_client = AsyncMock()
        mock_client.ping = AsyncMock(return_value=True)
        mock_client.aclose = AsyncMock()
        mock_from_url.return_value = mock_client

        result = await redis_check.run()

    assert result.name == "redis"
    assert result.status == CheckStatus.OK


@pytest.mark.asyncio
async def test_redis_check_fail() -> None:
    """Симулює помилку підключення Redis → очікуємо FAIL."""
    with patch("services.adv_dvs.checks.redis_check.aioredis.from_url") as mock_from_url:
        mock_client = AsyncMock()
        mock_client.ping = AsyncMock(side_effect=Exception("NOAUTH"))
        mock_client.aclose = AsyncMock()
        mock_from_url.return_value = mock_client

        result = await redis_check.run()

    assert result.status == CheckStatus.FAIL


# ─── DB ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_db_check_ok() -> None:
    """Симулює успішний SELECT 1 → очікуємо OK."""
    mock_conn = AsyncMock()
    mock_conn.fetchval = AsyncMock(return_value=1)
    mock_conn.close = AsyncMock()

    with patch("services.adv_dvs.checks.db_check.asyncpg.connect", AsyncMock(return_value=mock_conn)):
        result = await db_check.run()

    assert result.name == "db"
    assert result.status == CheckStatus.OK


@pytest.mark.asyncio
async def test_db_check_fail() -> None:
    """Симулює помилку підключення до БД → очікуємо FAIL."""
    with patch("services.adv_dvs.checks.db_check.asyncpg.connect", AsyncMock(side_effect=Exception("Connection refused"))):
        result = await db_check.run()

    assert result.status == CheckStatus.FAIL
