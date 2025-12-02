"""
Predator Analytics - Ukrainian Data Sources Service
Real connectors to Ukrainian government APIs
"""
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from loguru import logger

from app.core.config import settings


class UkrainianSourcesService:
    """
    Real connectors to Ukrainian government data sources:
    - Prozorro (public procurement)
    - EDR (business registry)
    - NBU (National Bank)
    - Tax Service
    - Customs
    """
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def close(self):
        await self.client.aclose()
    
    # === PROZORRO (Public Procurement) ===
    async def search_prozorro_tenders(
        self,
        query: str = "",
        status: str = "active",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search Prozorro tenders"""
        try:
            params = {
                "offset": "",
                "limit": limit
            }
            
            response = await self.client.get(
                f"{settings.PROZORRO_API_URL}/tenders",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            tenders = []
            for item in data.get("data", [])[:limit]:
                tender_id = item.get("id")
                # Get tender details
                detail_resp = await self.client.get(
                    f"{settings.PROZORRO_API_URL}/tenders/{tender_id}"
                )
                if detail_resp.status_code == 200:
                    tender = detail_resp.json().get("data", {})
                    tenders.append({
                        "id": tender.get("tenderID", tender_id),
                        "title": tender.get("title", ""),
                        "status": tender.get("status", ""),
                        "amount": tender.get("value", {}).get("amount", 0),
                        "currency": tender.get("value", {}).get("currency", "UAH"),
                        "procuringEntity": tender.get("procuringEntity", {}).get("name", ""),
                        "dateModified": tender.get("dateModified", ""),
                        "url": f"https://prozorro.gov.ua/tender/{tender_id}"
                    })
            
            return tenders
        except Exception as e:
            logger.error(f"Prozorro API error: {e}")
            return []
    
    async def get_tender_by_id(self, tender_id: str) -> Optional[Dict[str, Any]]:
        """Get specific Prozorro tender by ID"""
        try:
            response = await self.client.get(
                f"{settings.PROZORRO_API_URL}/tenders/{tender_id}"
            )
            response.raise_for_status()
            return response.json().get("data")
        except Exception as e:
            logger.error(f"Prozorro tender fetch error: {e}")
            return None
    
    # === EDR (Business Registry) via data.gov.ua ===
    async def search_companies(
        self,
        query: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search companies in Ukrainian registry"""
        try:
            # Using data.gov.ua CKAN API
            response = await self.client.get(
                f"{settings.EDR_API_URL}/datastore_search",
                params={
                    "resource_id": "1c7f3815-3259-45e0-bdf1-64dca07ddc10",  # EDR dataset
                    "q": query,
                    "limit": limit
                }
            )
            response.raise_for_status()
            data = response.json()
            
            companies = []
            for record in data.get("result", {}).get("records", []):
                companies.append({
                    "edrpou": record.get("EDRPOU", ""),
                    "name": record.get("NAME", ""),
                    "shortName": record.get("SHORT_NAME", ""),
                    "status": record.get("STAN", ""),
                    "address": record.get("ADDRESS", ""),
                    "director": record.get("DIRECTOR", ""),
                    "kved": record.get("KVED", ""),
                    "registrationDate": record.get("REGISTRATION_DATE", "")
                })
            
            return companies
        except Exception as e:
            logger.error(f"EDR API error: {e}")
            return []
    
    async def get_company_by_edrpou(self, edrpou: str) -> Optional[Dict[str, Any]]:
        """Get company by EDRPOU code"""
        companies = await self.search_companies(edrpou, limit=1)
        return companies[0] if companies else None
    
    # === NBU (National Bank of Ukraine) ===
    async def get_exchange_rates(self, date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get NBU exchange rates"""
        try:
            params = {}
            if date:
                params["date"] = date
            params["json"] = ""
            
            response = await self.client.get(
                f"{settings.NBU_API_URL}/statdirectory/exchange",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            return [
                {
                    "currency": item.get("cc", ""),
                    "name": item.get("txt", ""),
                    "rate": item.get("rate", 0),
                    "exchangeDate": item.get("exchangedate", "")
                }
                for item in data
            ]
        except Exception as e:
            logger.error(f"NBU API error: {e}")
            return []
    
    async def get_usd_rate(self) -> Optional[float]:
        """Get current USD/UAH rate"""
        rates = await self.get_exchange_rates()
        for rate in rates:
            if rate["currency"] == "USD":
                return rate["rate"]
        return None
    
    # === Tax Debtors Registry ===
    async def search_tax_debtors(
        self,
        query: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search tax debtors registry"""
        try:
            response = await self.client.get(
                f"{settings.EDR_API_URL}/datastore_search",
                params={
                    "resource_id": "e82ceb0b-3002-4aae-ab15-fe6c4c2cf7f7",  # Tax debtors
                    "q": query,
                    "limit": limit
                }
            )
            response.raise_for_status()
            data = response.json()
            
            debtors = []
            for record in data.get("result", {}).get("records", []):
                debtors.append({
                    "name": record.get("NAME", ""),
                    "edrpou": record.get("TIN", ""),
                    "debtAmount": record.get("SUM", 0),
                    "debtType": record.get("DEBT_TYPE", ""),
                    "region": record.get("REGION", "")
                })
            
            return debtors
        except Exception as e:
            logger.error(f"Tax debtors API error: {e}")
            return []
    
    # === Unified Search ===
    async def deep_scan(
        self,
        query: str,
        sectors: List[str] = None
    ) -> Dict[str, Any]:
        """
        Deep scan across all Ukrainian data sources
        Returns aggregated results with risk indicators
        """
        sectors = sectors or ["GOV", "BIZ", "TAX"]
        
        results = {
            "query": query,
            "timestamp": datetime.utcnow().isoformat(),
            "sources": [],
            "riskScore": 0,
            "findings": []
        }
        
        # Search companies
        if "BIZ" in sectors:
            companies = await self.search_companies(query, limit=5)
            if companies:
                results["sources"].append({
                    "type": "EDR",
                    "name": "Єдиний державний реєстр",
                    "count": len(companies),
                    "data": companies
                })
        
        # Search Prozorro
        if "GOV" in sectors:
            tenders = await self.search_prozorro_tenders(query, limit=5)
            if tenders:
                results["sources"].append({
                    "type": "PROZORRO",
                    "name": "ProZorro",
                    "count": len(tenders),
                    "data": tenders
                })
        
        # Search tax debtors
        if "TAX" in sectors:
            debtors = await self.search_tax_debtors(query, limit=5)
            if debtors:
                results["sources"].append({
                    "type": "TAX",
                    "name": "Реєстр боржників",
                    "count": len(debtors),
                    "data": debtors
                })
                # Increase risk if found in debtors
                results["riskScore"] += 0.3
                results["findings"].append(f"Знайдено в реєстрі боржників: {len(debtors)} записів")
        
        # Calculate final risk
        total_sources = len(results["sources"])
        if total_sources > 0:
            results["riskScore"] = min(results["riskScore"] + (total_sources * 0.1), 1.0)
        
        return results


# Global instance
ua_sources = UkrainianSourcesService()
