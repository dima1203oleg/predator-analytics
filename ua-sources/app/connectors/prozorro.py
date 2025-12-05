"""
Prozorro Connector - Ukrainian Public Procurement API
https://public.api.openprocurement.org/
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from .base import BaseConnector, ConnectorResult
import logging

logger = logging.getLogger(__name__)


class ProzorroConnector(BaseConnector):
    """
    Connector for Prozorro - Ukrainian public procurement system
    API Docs: https://public-docs.prozorro.gov.ua/
    """
    
    def __init__(self):
        super().__init__(
            name="Prozorro",
            base_url="https://public.api.openprocurement.org/api/2.5",
            timeout=30.0
        )
    
    async def search(
        self,
        query: str,
        limit: int = 20,
        status: Optional[str] = None,
        **kwargs
    ) -> ConnectorResult:
        """
        Search Prozorro tenders
        
        Args:
            query: Search query (company name, EDRPOU, or keywords)
            limit: Maximum results to return
            status: Filter by tender status (active, complete, cancelled)
        """
        params = {
            "opt_fields": "title,description,status,value,dateModified",
            "limit": min(limit, 100)
        }
        
        if status:
            params["status"] = status
        
        result = await self._request("GET", "/tenders", params=params)
        
        if result.success and result.data:
            tenders = result.data.get("data", [])
            # Filter by query if provided
            if query:
                query_lower = query.lower()
                tenders = [
                    t for t in tenders 
                    if query_lower in str(t.get("title", "")).lower()
                    or query_lower in str(t.get("description", "")).lower()
                ]
            
            result.data = tenders[:limit]
            result.records_count = len(result.data)
        
        return result
    
    async def get_by_id(self, tender_id: str) -> ConnectorResult:
        """Get specific tender by ID"""
        return await self._request("GET", f"/tenders/{tender_id}")
    
    async def get_tender_documents(self, tender_id: str) -> ConnectorResult:
        """Get documents attached to a tender"""
        return await self._request("GET", f"/tenders/{tender_id}/documents")
    
    async def get_tender_bids(self, tender_id: str) -> ConnectorResult:
        """Get bids for a tender (if available)"""
        return await self._request("GET", f"/tenders/{tender_id}/bids")
    
    async def search_by_edrpou(self, edrpou: str, limit: int = 20) -> ConnectorResult:
        """Search tenders by company EDRPOU"""
        # Prozorro doesn't have direct EDRPOU search, so we search in title/description
        return await self.search(query=edrpou, limit=limit)


# Singleton instance
prozorro_connector = ProzorroConnector()
