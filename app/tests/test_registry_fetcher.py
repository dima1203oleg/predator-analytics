# app/tests/test_registry_fetcher.py
"""Тести для модуля RegistryFetcher.
Перевіряє, що методи коректно роблять запити та обробляють відповіді.
"""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.registry_fetcher import RegistryFetcher

@pytest.fixture
def mock_async_client(monkeypatch):
    """Підміняє httpx.AsyncClient на мок‑об’єкт."""
    mock_client = MagicMock()
    mock_client.get = AsyncMock()
    mock_client.aclose = AsyncMock()
    monkeypatch.setattr('httpx.AsyncClient', lambda *args, **kwargs: mock_client)
    return mock_client

@pytest.mark.asyncio
async def test_fetch_edrpou_success(mock_async_client):
    # Підготовка мок‑відповіді
    expected_data = {"edrpou": "12345678", "name": "Тестова Компанія"}
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json = MagicMock(return_value=expected_data)
    mock_async_client.get.return_value = response

    fetcher = RegistryFetcher()
    result = await fetcher.fetch_edrpou("12345678")
    await fetcher.close()

    assert result == expected_data
    mock_async_client.get.assert_awaited_once_with("https://api.open-data.gov.ua/edrpou/12345678")

@pytest.mark.asyncio
async def test_fetch_edrpou_error(mock_async_client, caplog):
    # Імітуємо помилку HTTP
    mock_async_client.get.side_effect = Exception("Network error")

    fetcher = RegistryFetcher()
    result = await fetcher.fetch_edrpou("00000000")
    await fetcher.close()

    assert result == {}
    # Перевіряємо, що логи містять повідомлення про помилку
    assert any("Помилка запиту до ЄДРПОУ" in record.message for record in caplog.records)
