import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.services.ua_sources import ua_sources

@pytest.mark.asyncio
async def test_search_companies_mock():
    # Mock response data
    mock_response_data = {
        "result": {
            "records": [
                {
                    "EDRPOU": "12345678",
                    "NAME": "Test Company LLC",
                    "SHORT_NAME": "Test Co",
                    "STAN": "registered",
                    "ADDRESS": "Kyiv",
                    "DIRECTOR": "John Doe",
                    "KVED": "62.01",
                    "REGISTRATION_DATE": "2020-01-01"
                }
            ]
        }
    }

    # Create a mock client
    mock_client = MagicMock()
    mock_client.get = AsyncMock()
    
    mock_resp_obj = MagicMock()
    mock_resp_obj.status_code = 200
    mock_resp_obj.json.return_value = mock_response_data
    mock_resp_obj.raise_for_status = MagicMock()
    
    mock_client.get.return_value = mock_resp_obj

    # Replace the real client with mock
    original_client = ua_sources.client
    ua_sources.client = mock_client

    try:
        results = await ua_sources.search_companies("Test Company")
        
        assert len(results) == 1
        assert results[0]["edrpou"] == "12345678"
        assert results[0]["name"] == "Test Company LLC"
        
        mock_client.get.assert_called_once()
    finally:
        # Restore original client
        ua_sources.client = original_client

@pytest.mark.asyncio
async def test_search_prozorro_tenders_mock():
    mock_list_response = {
        "data": [
            {"id": "UA-2023-01-01-000001-a"}
        ]
    }
    mock_detail_response = {
        "data": {
            "tenderID": "UA-2023-01-01-000001-a",
            "title": "Test Tender",
            "status": "active",
            "value": {"amount": 100000, "currency": "UAH"},
            "procuringEntity": {"name": "State Org"},
            "dateModified": "2023-01-01T00:00:00Z"
        }
    }

    mock_client = MagicMock()
    mock_client.get = AsyncMock()
    
    async def side_effect(url, params=None):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.raise_for_status = MagicMock()
        
        if url.endswith("/tenders"):
            mock_resp.json.return_value = mock_list_response
        else:
            mock_resp.json.return_value = mock_detail_response
        return mock_resp

    mock_client.get.side_effect = side_effect

    original_client = ua_sources.client
    ua_sources.client = mock_client

    try:
        results = await ua_sources.search_prozorro_tenders("query")
        assert len(results) == 1
        assert results[0]["id"] == "UA-2023-01-01-000001-a"
        assert results[0]["amount"] == 100000
    finally:
        ua_sources.client = original_client

@pytest.mark.asyncio
async def test_deep_scan_aggregation():
    # Mock the individual search methods on the instance
    with patch.object(ua_sources, 'search_companies', new_callable=AsyncMock) as mock_companies, \
         patch.object(ua_sources, 'search_prozorro_tenders', new_callable=AsyncMock) as mock_tenders, \
         patch.object(ua_sources, 'search_tax_debtors', new_callable=AsyncMock) as mock_debtors:
        
        mock_companies.return_value = [{"name": "Company A", "edrpou": "123"}]
        mock_tenders.return_value = [{"id": "Tender 1"}]
        mock_debtors.return_value = [{"name": "Company A", "debtAmount": 1000}]

        results = await ua_sources.deep_scan("Company A")
        
        assert results["query"] == "Company A"
        # Check sources
        source_types = [s["type"] for s in results["sources"]]
        assert "EDR" in source_types
        assert "PROZORRO" in source_types
        assert "TAX" in source_types
        
        # Check risk score calculation
        # Base risk 0.
        # +0.3 for tax debtors
        # +0.3 for 3 sources (0.1 * 3)
        # Total should be 0.6
        assert results["riskScore"] >= 0.6
