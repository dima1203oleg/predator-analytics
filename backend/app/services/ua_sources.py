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
        # Static stubs to avoid network dependency in demo/offline mode
        self._stub_prozorro = [
            {
                "id": "UA-2025-12-01-000001",
                "title": "Послуги з кібербезпеки для держустанов",
                "status": "active",
                "amount": 1200000,
                "currency": "UAH",
                "procuringEntity": "Мінцифри",
                "dateModified": datetime.utcnow().isoformat(),
                "url": "https://prozorro.gov.ua/tender/UA-2025-12-01-000001"
            }
        ]
        self._stub_companies = [
            {
                "edrpou": "12345678",
                "name": "ТОВ \"ПРЕДАТОР АНАЛІТИКА\"",
                "shortName": "ПРЕДАТОР",
                "status": "діюча",
                "address": "м. Київ, вул. Даних, 1",
                "director": "Іваненко Іван",
                "kved": "62.01",
                "registrationDate": "2021-03-15"
            }
        ]
        self._stub_debtors = [
            {
                "name": "ТОВ \"СТАР ДЕБТ\"",
                "edrpou": "99990000",
                "debtAmount": 1500000,
                "debtType": "Податковий борг",
                "region": "м. Київ"
            }
        ]
        self._stub_rates = [
            {"currency": "USD", "name": "Долар США", "rate": 41.5, "exchangeDate": datetime.utcnow().strftime("%d.%m.%Y")}
        ]
    
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
        if settings.USE_STUB_DATA:
            normalized = query.lower() if query else ""
            items = [i for i in self._stub_prozorro if normalized in i["title"].lower() or normalized in i["id"].lower()] if query else self._stub_prozorro
            return items[:limit]

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
                    # Simple client-side filter to honor query without relying on API search
                    if query:
                        normalized = query.lower()
                        if normalized not in tender.get("title", "").lower() and normalized not in tender_id.lower():
                            continue
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
        if settings.USE_STUB_DATA:
            normalized = query.lower() if query else ""
            items = [i for i in self._stub_companies if normalized in i["name"].lower() or normalized in i["edrpou"].lower()] if query else self._stub_companies
            return items[:limit]

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
        if settings.USE_STUB_DATA:
            return self._stub_rates

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
        if settings.USE_STUB_DATA:
            normalized = query.lower() if query else ""
            items = [i for i in self._stub_debtors if normalized in i["name"].lower() or normalized in i["edrpou"].lower()] if query else self._stub_debtors
            return items[:limit]

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
