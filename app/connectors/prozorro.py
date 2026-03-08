from __future__ import annotations


"""Prozorro Connector - Ukrainian Public Procurement API
https://public.api.openprocurement.org/.
"""
import logging

from .base import BaseConnector, ConnectorResult


logger = logging.getLogger(__name__)


class ProzorroConnector(BaseConnector):
    """Connector for Prozorro - Ukrainian public procurement system
    API Docs: https://public-docs.prozorro.gov.ua/.
    """

    def __init__(self):
        super().__init__(
            name="Prozorro", base_url="https://public.api.openprocurement.org/api/2.5", timeout=30.0
        )

    async def search(
        self, query: str, limit: int = 10, status: str | None = None, **kwargs
    ) -> ConnectorResult:
        """Search Prozorro tenders using the public API."""
        # The public API /tenders is mostly for polling. 
        # For actual search by keywords, we often need data.gov.ua datasets or specialized search.
        # But we'll use the official API's offset-based listing and filter for now as a baseline.
        params = {
            "opt_fields": "title,description,status,value,dateModified,procuringEntity",
            "limit": min(limit * 5, 100), # Fetch more to allow filtering
        }

        if status:
            params["status"] = status

        result = await self._request("GET", "/tenders", params=params)

        if result.success and result.data:
            tenders = result.data.get("data", [])
            
            # 2. Advanced Filtering (since public API /tenders doesn't support 'q' param directly)
            filtered = []
            if query:
                q = query.lower()
                for t in tenders:
                    title = str(t.get("title", "")).lower()
                    desc = str(t.get("description", "")).lower()
                    owner = str(t.get("procuringEntity", {}).get("name", "")).lower()
                    edrpou = str(t.get("procuringEntity", {}).get("identifier", {}).get("id", "")).lower()
                    
                    if q in title or q in desc or q in owner or q in edrpou:
                        filtered.append(t)
            else:
                filtered = tenders

            result.data = filtered[:limit]
            result.records_count = len(result.data)
            logger.info(f"Prozorro search for '{query}' returned {len(result.data)} results")

        return result

    async def get_by_id(self, tender_id: str) -> ConnectorResult:
        """Get specific tender details."""
        return await self._request("GET", f"/tenders/{tender_id}")

    async def search_by_edrpou(self, edrpou: str, limit: int = 10) -> ConnectorResult:
        """Search tenders where the procuring entity has the given EDRPOU."""
        return await self.search(query=edrpou, limit=limit)

    async def fetch(self, config: dict) -> ConnectorResult:
        """Generic fetch for ETL worker."""
        query = config.get("query", "")
        limit = config.get("limit", 20)
        return await self.search(query=query, limit=limit)


# Singleton instance
prozorro_connector = ProzorroConnector()
