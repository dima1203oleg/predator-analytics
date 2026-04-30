from __future__ import annotations

"""Customs Connector - Ukrainian Customs Service Data
Import/Export statistics and declarations.
"""
import logging

from .base import BaseConnector, ConnectorResult

logger = logging.getLogger(__name__)


class CustomsConnector(BaseConnector):
    """Connector for Ukrainian Customs Service data
    Note: Limited public API, mostly uses data.gov.ua datasets.
    """

    def __init__(self):
        super().__init__(
            name="UA Customs", base_url="https://data.gov.ua/api/3/action", timeout=30.0
        )
        self.datasets = {
            "import_stats": "customs-import-stats",
            "export_stats": "customs-export-stats",
        }

    def __init__(self):
        super().__init__(
            # data.gov.ua uses CKAN API
            name="UA Customs", base_url="https://data.gov.ua/api/3/action", timeout=60.0
        )
        self.dataset_keywords = ["митні декларації", "експорт", "імпорт"]

    async def search(self, query: str, limit: int = 10, **kwargs) -> ConnectorResult:
        """Search for customs-related datasets on data.gov.ua."""
        search_query = query or "митні декларації"
        params = {"q": search_query, "rows": limit}

        result = await self._request("GET", "/package_search", params=params)

        if result.success and result.data:
            datasets = result.data.get("result", {}).get("results", [])

            # Format results for easier consumption
            formatted_data = []
            for ds in datasets:
                formatted_data.append({
                    "id": ds.get("id"),
                    "name": ds.get("name"),
                    "title": ds.get("title"),
                    "notes": ds.get("notes"),
                    "metadata_modified": ds.get("metadata_modified"),
                    "resources_count": len(ds.get("resources", [])),
                    "tags": [t.get("display_name") for t in ds.get("tags", [])]
                })

            result.data = formatted_data
            result.records_count = len(formatted_data)

        return result

    async def get_by_id(self, dataset_id: str) -> ConnectorResult:
        """Get dataset details including resource links (CSV/JSON)."""
        params = {"id": dataset_id}
        result = await self._request("GET", "/package_show", params=params)

        if result.success and result.data:
            ds = result.data.get("result", {})
            resources = ds.get("resources", [])

            # Find the most recent CSV or Excel resource
            latest_resource = None
            for res in sorted(resources, key=lambda x: x.get("created", ""), reverse=True):
                if res.get("format", "").upper() in ["CSV", "XLSX", "JSON"]:
                    latest_resource = res
                    break

            result.data = {
                "id": ds.get("id"),
                "title": ds.get("title"),
                "latest_resource": latest_resource,
                "all_resources": resources
            }

        return result

    async def fetch_latest_declarations(self, limit: int = 100) -> list[dict[str, Any]]:
        """Fetch records from the latest available customs resource."""
        search_res = await self.search("митні декларації", limit=1)
        if not search_res.success or not search_res.data:
            return []

        ds_id = search_res.data[0]["id"]
        ds_res = await self.get_by_id(ds_id)

        if not ds_res.success or not ds_res.data.get("latest_resource"):
            return []

        resource = ds_res.data["latest_resource"]
        resource_id = resource["id"]

        # CKAN Datastore API to fetch actual data if available
        # Otherwise we'd have to download the file (out of scope for quick status check)
        params = {"resource_id": resource_id, "limit": limit}
        data_res = await self._request("GET", "/datastore_search", params=params)

        if data_res.success and data_res.data:
            records = data_res.data.get("result", {}).get("records", [])
            logger.info(f"Fetched {len(records)} real records from data.gov.ua resource {resource_id}")
            return records

        return []

    async def fetch(self, config: dict) -> ConnectorResult:
        """Generic fetch method compatible with ETL worker."""
        try:
            limit = config.get("limit", 100)
            records = await self.fetch_latest_declarations(limit=limit)

            return ConnectorResult(
                success=True,
                data=records,
                records_count=len(records),
                source=self.name
            )
        except Exception as e:
            logger.exception(f"Fetch error in CustomsConnector: {e}")
            return ConnectorResult(success=False, data=[], error=str(e), source=self.name)


# Singleton instance
customs_connector = CustomsConnector()
