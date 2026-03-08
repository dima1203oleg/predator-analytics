from __future__ import annotations


"""EDRPOU Connector (COMP-033)

Connector for the Unified State Register of Enterprises (ЄДРПОУ).
Fetches company details by EDRPOU code from opendatabot.ua and data.gov.ua.

Sources:
- https://opendatabot.ua/api/ (commercial, if API key provided)
- data.gov.ua (open data, CKAN API)
"""
import logging
from typing import Any

from app.connectors.base import BaseConnector, ConnectorResult


logger = logging.getLogger("connector.edrpou")


class EDRPOUConnector(BaseConnector):
    """Connector for Ukrainian EDRPOU registry.

    Provides company lookup by:
    - EDRPOU code (8-digit identifier)
    - Company name search
    - Director/founder name search
    """

    def __init__(self, api_key: str | None = None):
        super().__init__(
            name="EDRPOUConnector",
            base_url="https://data.gov.ua",
            timeout=30.0,
        )
        self.api_key = api_key
        self._opendatabot_url = "https://opendatabot.ua/api/v3"
        logger.info("EDRPOUConnector initialized")

    async def search(self, query: str, limit: int = 20, **kwargs) -> ConnectorResult:
        """Search EDRPOU registry by company name or code.

        Args:
            query: Company name or EDRPOU code
            limit: Max results
            **kwargs:
                search_type: 'name', 'edrpou', or 'director'

        Returns:
            ConnectorResult with company records
        """
        search_type = kwargs.get("search_type", "auto")

        # Auto-detect: if all digits and 8 chars, treat as EDRPOU code
        if search_type == "auto":
            if query.strip().isdigit() and len(query.strip()) == 8:
                search_type = "edrpou"
            else:
                search_type = "name"

        if search_type == "edrpou":
            return await self._search_by_edrpou(query.strip())
        else:
            return await self._search_by_name(query, limit)

    async def _search_by_edrpou(self, edrpou: str) -> ConnectorResult:
        """Search by exact EDRPOU code."""
        # Try data.gov.ua CKAN API
        params = {
            "resource_id": "",  # Would be the specific resource ID
            "q": edrpou,
            "limit": 5,
        }

        # Try opendatabot if API key is available
        if self.api_key:
            try:
                from app.connectors.base import ConnectorResult as CR
                import httpx

                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.get(
                        f"{self._opendatabot_url}/company/{edrpou}",
                        params={"apiKey": self.api_key},
                        headers={"Accept": "application/json"},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return ConnectorResult(
                            success=True,
                            data=self._normalize_opendatabot(data),
                            source="opendatabot",
                            records_count=1,
                        )
            except Exception as e:
                logger.warning(f"OpenDataBot lookup failed: {e}")

        # Fallback: CKAN search on data.gov.ua
        result = await self._request(
            "GET",
            "/api/3/action/datastore_search",
            params={"q": edrpou},
        )

        if result.success and result.data:
            records = result.data.get("result", {}).get("records", [])
            return ConnectorResult(
                success=True,
                data=[self._normalize_record(r) for r in records],
                source="data.gov.ua",
                records_count=len(records),
            )

        return ConnectorResult(
            success=False,
            data=None,
            error=f"EDRPOU {edrpou} not found",
            source=self.name,
        )

    async def _search_by_name(self, name: str, limit: int = 20) -> ConnectorResult:
        """Search by company name."""
        result = await self._request(
            "GET",
            "/api/3/action/package_search",
            params={
                "q": name,
                "rows": limit,
                "fq": "organization:minjust",  # Ministry of Justice
            },
        )

        if result.success and result.data:
            results_data = result.data.get("result", {}).get("results", [])
            companies = [self._normalize_ckan(r) for r in results_data]
            return ConnectorResult(
                success=True,
                data=companies,
                source="data.gov.ua",
                records_count=len(companies),
            )

        return ConnectorResult(
            success=True,
            data=[],
            source=self.name,
            records_count=0,
        )

    async def get_by_id(self, record_id: str) -> ConnectorResult:
        """Get company by EDRPOU code."""
        return await self._search_by_edrpou(record_id)

    async def fetch(
        self, limit: int = 100, offset: int = 0, **kwargs
    ) -> ConnectorResult:
        """Fetch batch of EDRPOU records for ETL.

        Args:
            limit: Records per page
            offset: Offset for pagination

        Returns:
            ConnectorResult with company records
        """
        result = await self._request(
            "GET",
            "/api/3/action/datastore_search",
            params={"limit": limit, "offset": offset},
        )

        if result.success and result.data:
            records = result.data.get("result", {}).get("records", [])
            return ConnectorResult(
                success=True,
                data=[self._normalize_record(r) for r in records],
                source="data.gov.ua",
                records_count=len(records),
            )

        return ConnectorResult(
            success=False,
            data=None,
            error="Failed to fetch EDRPOU batch",
            source=self.name,
        )

    def _normalize_opendatabot(self, data: dict) -> dict[str, Any]:
        """Normalize OpenDataBot response."""
        return {
            "edrpou": data.get("code", ""),
            "name": data.get("full_name", data.get("short_name", "")),
            "short_name": data.get("short_name", ""),
            "status": data.get("status", ""),
            "registration_date": data.get("registration_date", ""),
            "address": data.get("location", {}).get("address", ""),
            "director": data.get("ceo_name", ""),
            "authorized_capital": data.get("authorized_capital", 0),
            "kved": data.get("primary_activity_kind", {}).get("code", ""),
            "kved_name": data.get("primary_activity_kind", {}).get("name", ""),
            "founders": [
                {"name": f.get("name", ""), "share": f.get("percent", 0)}
                for f in data.get("founders", [])
            ],
            "source": "opendatabot",
        }

    def _normalize_record(self, record: dict) -> dict[str, Any]:
        """Normalize data.gov.ua datastore record."""
        return {
            "edrpou": record.get("edrpou", record.get("EDRPOU", "")),
            "name": record.get("name", record.get("NAME", "")),
            "status": record.get("status", ""),
            "address": record.get("address", record.get("ADDRESS", "")),
            "source": "data.gov.ua",
        }

    def _normalize_ckan(self, record: dict) -> dict[str, Any]:
        """Normalize CKAN package record."""
        return {
            "id": record.get("id", ""),
            "name": record.get("title", record.get("name", "")),
            "description": record.get("notes", ""),
            "organization": record.get("organization", {}).get("title", ""),
            "source": "data.gov.ua",
        }


# Singleton
edrpou_connector = EDRPOUConnector()
