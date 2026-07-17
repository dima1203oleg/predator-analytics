from unittest.mock import AsyncMock, patch

from httpx import Response
import pytest

from app.harvesters.ckan_harvester import CKANHarvester
from app.harvesters.edr_aggregator import EDRAggregator
from app.harvesters.prozorro_sync import ProzorroSync


@pytest.fixture
def ckan_harvester():
    return CKANHarvester()

@pytest.fixture
def prozorro_sync():
    return ProzorroSync()

@pytest.fixture
def edr_aggregator():
    return EDRAggregator()


@pytest.mark.asyncio
async def test_ckan_harvester_package_search(ckan_harvester):
    # Mock HTTP response
    mock_response = Response(
        status_code=200,
        json={
            "success": True,
            "result": {
                "count": 1,
                "results": [
                    {
                        "id": "123",
                        "title": "Тестовий набір",
                        "organization": {"title": "Міністерство Тестів"}
                    }
                ]
            }
        },
        request=AsyncMock()
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        result = await ckan_harvester.fetch_package_search(query="title:test", limit=1)

        assert result is not None
        assert result["success"] is True
        assert result["result"]["count"] == 1
        assert result["result"]["results"][0]["title"] == "Тестовий набір"


@pytest.mark.asyncio
async def test_prozorro_sync_fetch_tenders(prozorro_sync):
    mock_response = Response(
        status_code=200,
        json={
            "data": [
                {"id": "t1", "dateModified": "2026-07-17T12:00:00Z"},
                {"id": "t2", "dateModified": "2026-07-17T12:05:00Z"}
            ],
            "next_page": {
                "offset": "2026-07-17T12:05:00Z"
            }
        },
        request=AsyncMock()
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        data, next_offset = await prozorro_sync.fetch_tenders_batch(offset=None, limit=2)

        assert len(data) == 2
        assert next_offset == "2026-07-17T12:05:00Z"
        assert data[0]["id"] == "t1"


@pytest.mark.asyncio
async def test_edr_aggregator_mock_profile(edr_aggregator):
    # EDR currently returns mock data based on the analytical report
    profile = await edr_aggregator.get_company_profile("04362489")

    assert profile is not None
    assert profile["edrpou"] == "04362489"
    assert profile["name"] == "Борщагівська сільська рада"
    assert profile["status"] == "зареєстровано"
    assert len(profile["founders"]) == 2
    assert profile["founders"][0]["name"] == "Держава Україна"
