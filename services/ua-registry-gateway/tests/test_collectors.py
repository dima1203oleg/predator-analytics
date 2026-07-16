"""Unit-тести для колекторів UA Registry Gateway.

Використовує pytest-httpx для мокування HTTP-запитів без реальних HTTP-з'єднань.
Kafka producer мокується через unittest.mock.
"""
from unittest.mock import AsyncMock, patch

import pytest

from app.collectors.prozorro import ProzorroCollector, collect_prozorro, _build_event
from app.collectors.datagov import DataGovUACollector, collect_datagov


# ─────────────────────────────────────────
# Фікстури
# ─────────────────────────────────────────

MOCK_TENDERS_RESPONSE = {
    "data": [
        {"id": "tender-001", "status": "active", "tenderID": "UA-2024-01-01-000001"},
        {"id": "tender-002", "status": "complete", "tenderID": "UA-2024-01-02-000001"},
    ],
    "next_page": {"offset": "abc123"},
}

MOCK_DATAGOV_RESPONSE = {
    "success": True,
    "result": {
        "results": [
            {"id": "dataset-001", "name": "edr-data", "title": "ЄДР відкриті дані"},
        ],
        "count": 1,
    },
}


# ─────────────────────────────────────────
# Тести ProzorroCollector
# ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_prozorro_fetch_tenders_page_success(httpx_mock):
    """Перевірка успішного завантаження сторінки тендерів."""
    httpx_mock.add_response(
        url__contains="/tenders",
        json=MOCK_TENDERS_RESPONSE,
        status_code=200,
    )
    async with ProzorroCollector() as collector:
        result = await collector.fetch_tenders_page(limit=2)

    assert len(result["data"]) == 2
    assert result["data"][0]["id"] == "tender-001"


@pytest.mark.asyncio
async def test_prozorro_fetch_tender_detail_success(httpx_mock):
    """Перевірка успішного завантаження деталей тендеру."""
    tender_id = "tender-001"
    httpx_mock.add_response(
        url__contains=f"/tenders/{tender_id}",
        json={"data": {"id": tender_id, "status": "active"}},
        status_code=200,
    )
    async with ProzorroCollector() as collector:
        detail = await collector.fetch_tender_detail(tender_id)

    assert detail is not None
    assert detail["id"] == tender_id


@pytest.mark.asyncio
async def test_prozorro_fetch_tender_detail_not_found(httpx_mock):
    """Перевірка обробки HTTP 404 для неіснуючого тендеру."""
    httpx_mock.add_response(
        url__contains="/tenders/bad-id",
        status_code=404,
    )
    async with ProzorroCollector() as collector:
        detail = await collector.fetch_tender_detail("bad-id")

    assert detail is None


def test_build_event_structure():
    """Перевірка формату Kafka-події."""
    tender = {"id": "test", "status": "active"}
    event = _build_event(tender)

    assert event["source"] == "ua.prozorro"
    assert event["event_type"] == "tender.fetched"
    assert "collected_at" in event
    assert event["payload"] == tender


@pytest.mark.asyncio
async def test_collect_prozorro_publishes_to_kafka(httpx_mock):
    """Перевірка, що collect_prozorro публікує події в Kafka."""
    httpx_mock.add_response(
        url__contains="/tenders",
        json=MOCK_TENDERS_RESPONSE,
        status_code=200,
    )
    with patch(
        "app.collectors.prozorro.publish_event",
        new_callable=AsyncMock,
        return_value=True,
    ) as mock_publish:
        await collect_prozorro()

    # Очікуємо 2 виклики publish_event — по одному для кожного тендеру
    assert mock_publish.call_count == 2


# ─────────────────────────────────────────
# Тести DataGovUACollector
# ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_datagov_list_recent_datasets_success(httpx_mock):
    """Перевірка успішного завантаження датасетів."""
    httpx_mock.add_response(
        url__contains="/package_search",
        json=MOCK_DATAGOV_RESPONSE,
        status_code=200,
    )
    async with DataGovUACollector() as collector:
        datasets = await collector.list_recent_datasets(limit=1)

    assert len(datasets) == 1
    assert datasets[0]["id"] == "dataset-001"


@pytest.mark.asyncio
async def test_datagov_api_failure_returns_empty(httpx_mock):
    """Перевірка поведінки при помилці API — повертає порожній список."""
    httpx_mock.add_response(
        url__contains="/package_search",
        status_code=500,
    )
    async with DataGovUACollector() as collector:
        datasets = await collector.list_recent_datasets()

    assert datasets == []


@pytest.mark.asyncio
async def test_collect_datagov_publishes_to_kafka(httpx_mock):
    """Перевірка, що collect_datagov публікує події в Kafka."""
    httpx_mock.add_response(
        url__contains="/package_search",
        json=MOCK_DATAGOV_RESPONSE,
        status_code=200,
    )
    with patch(
        "app.collectors.datagov.publish_event",
        new_callable=AsyncMock,
        return_value=True,
    ) as mock_publish:
        await collect_datagov()

    assert mock_publish.call_count == 1
