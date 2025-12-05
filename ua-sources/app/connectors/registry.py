"""
Registry Connector - Ukrainian Business Registry (EDR)
Unified State Register of Legal Entities
"""
from typing import Dict, Any, List, Optional
from .base import BaseConnector, ConnectorResult
import logging

logger = logging.getLogger(__name__)


class RegistryConnector(BaseConnector):
    """
    Connector for Ukrainian Business Registry (EDR)
    Data source: data.gov.ua
    """
    
    def __init__(self):
        super().__init__(
            name="EDR (Business Registry)",
            base_url="https://data.gov.ua/api/3/action",
            timeout=30.0
        )
        self.dataset_id = "1c7f3815-3259-45e0-bdf1-64dca07ddc10"
    
    async def search(
        self,
        query: str,
        limit: int = 20,
        **kwargs
    ) -> ConnectorResult:
        """
        Search companies in EDR
        
        Args:
            query: Company name or EDRPOU code
            limit: Maximum results to return
        """
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
    
    async def get_by_id(self, edrpou: str) -> ConnectorResult:
        """Get company by EDRPOU code"""
        return await self.search(query=edrpou, limit=1)
    
    async def get_company_by_edrpou(self, edrpou: str) -> Optional[Dict[str, Any]]:
        """
        Get company details by EDRPOU
        Returns None if not found
        """
        result = await self.get_by_id(edrpou)
        
        if result.success and result.data:
            return result.data[0] if result.data else None
        
        return None
    
    async def search_companies(
        self,
        name: str,
        limit: int = 20,
        include_closed: bool = False
    ) -> ConnectorResult:
        """
        Search companies by name
        
        Args:
            name: Company name (partial match)
            limit: Maximum results
            include_closed: Include closed/liquidated companies
        """
        result = await self.search(query=name, limit=limit)
        
        if result.success and result.data and not include_closed:
            # Filter out closed companies if needed
            result.data = [
                c for c in result.data
                if c.get("state", "").lower() != "closed"
            ]
            result.records_count = len(result.data)
        
        return result
    
    async def get_beneficial_owners(self, edrpou: str) -> ConnectorResult:
        """Get beneficial owners for a company"""
        # Would need specific API endpoint
        return ConnectorResult(
            success=True,
            data=[],
            source=self.name,
            records_count=0
        )


# Singleton instance
registry_connector = RegistryConnector()
