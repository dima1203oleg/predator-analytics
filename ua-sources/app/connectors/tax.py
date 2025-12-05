"""
Tax Connector - Ukrainian Tax Authority Data
DFS/Tax Service open data
"""
from typing import Dict, Any, List, Optional
from .base import BaseConnector, ConnectorResult
import logging

logger = logging.getLogger(__name__)


class TaxConnector(BaseConnector):
    """
    Connector for Ukrainian Tax Authority open data
    Includes tax debtors, VAT payers registry
    """
    
    def __init__(self):
        super().__init__(
            name="UA Tax Registry",
            base_url="https://data.gov.ua/api/3/action",
            timeout=30.0
        )
        # Known dataset IDs
        self.datasets = {
            "tax_debtors": "d8d51028-2478-4a74-85a7-9f1f0d4b3e8b",
            "vat_payers": "1c7f3815-3259-45e0-bdf1-64dca07ddc10"
        }
    
    async def search(
        self,
        query: str,
        limit: int = 20,
        dataset: str = "tax_debtors",
        **kwargs
    ) -> ConnectorResult:
        """
        Search tax records
        
        Args:
            query: Company name or EDRPOU
            limit: Maximum results
            dataset: Which dataset to search (tax_debtors, vat_payers)
        """
        dataset_id = self.datasets.get(dataset, self.datasets["tax_debtors"])
        
        params = {
            "resource_id": dataset_id,
            "q": query,
            "limit": limit
        }
        
        result = await self._request("GET", "/datastore_search", params=params)
        
        if result.success and result.data:
            records = result.data.get("result", {}).get("records", [])
            result.data = records
            result.records_count = len(records)
        
        return result
    
    async def get_by_id(self, edrpou: str) -> ConnectorResult:
        """Get tax record by EDRPOU"""
        return await self.search(query=edrpou, limit=1)
    
    async def search_tax_debtors(
        self,
        query: str,
        limit: int = 20
    ) -> ConnectorResult:
        """Search tax debtors registry"""
        return await self.search(query=query, limit=limit, dataset="tax_debtors")
    
    async def search_vat_payers(
        self,
        query: str,
        limit: int = 20
    ) -> ConnectorResult:
        """Search VAT payers registry"""
        return await self.search(query=query, limit=limit, dataset="vat_payers")
    
    async def check_tax_debtor(self, edrpou: str) -> Dict[str, Any]:
        """Check if company is a tax debtor"""
        result = await self.search_tax_debtors(edrpou, limit=1)
        
        if result.success and result.data:
            return {
                "is_debtor": len(result.data) > 0,
                "details": result.data[0] if result.data else None
            }
        
        return {"is_debtor": False, "details": None, "error": result.error}


# Singleton instance
tax_connector = TaxConnector()
