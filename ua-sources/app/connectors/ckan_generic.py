"""
CKAN Generic Connector - For any CKAN-based open data portal
Used for data.gov.ua and similar platforms
"""
from typing import Dict, Any, List, Optional
from .base import BaseConnector, ConnectorResult
import logging

logger = logging.getLogger(__name__)


class CKANGenericConnector(BaseConnector):
    """
    Generic connector for CKAN-based open data portals
    Works with data.gov.ua and similar platforms
    """
    
    def __init__(
        self,
        name: str = "CKAN Portal",
        base_url: str = "https://data.gov.ua/api/3/action"
    ):
        super().__init__(name=name, base_url=base_url, timeout=30.0)
    
    async def search(
        self,
        query: str,
        limit: int = 20,
        **kwargs
    ) -> ConnectorResult:
        """Search datasets in CKAN portal"""
        params = {
            "q": query,
            "rows": limit
        }
        
        result = await self._request("GET", "/package_search", params=params)
        
        if result.success and result.data:
            results = result.data.get("result", {}).get("results", [])
            result.data = results
            result.records_count = len(results)
        
        return result
    
    async def get_by_id(self, package_id: str) -> ConnectorResult:
        """Get dataset by ID"""
        params = {"id": package_id}
        return await self._request("GET", "/package_show", params=params)
    
    async def get_resource(self, resource_id: str) -> ConnectorResult:
        """Get specific resource from a dataset"""
        params = {"id": resource_id}
        return await self._request("GET", "/resource_show", params=params)
    
    async def datastore_search(
        self,
        resource_id: str,
        query: Optional[str] = None,
        filters: Optional[Dict] = None,
        limit: int = 100
    ) -> ConnectorResult:
        """
        Search within a datastore resource
        
        Args:
            resource_id: CKAN resource ID
            query: Full-text search query
            filters: Field-specific filters
            limit: Maximum records
        """
        params = {
            "resource_id": resource_id,
            "limit": limit
        }
        
        if query:
            params["q"] = query
        if filters:
            params["filters"] = str(filters)
        
        result = await self._request("GET", "/datastore_search", params=params)
        
        if result.success and result.data:
            records = result.data.get("result", {}).get("records", [])
            result.data = records
            result.records_count = len(records)
        
        return result
    
    async def list_datasets(self, limit: int = 50) -> ConnectorResult:
        """List available datasets"""
        params = {"limit": limit}
        return await self._request("GET", "/package_list", params=params)


# Default instance for data.gov.ua
ckan_connector = CKANGenericConnector()
