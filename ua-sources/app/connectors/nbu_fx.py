"""
NBU FX Connector - National Bank of Ukraine Exchange Rates
https://bank.gov.ua/NBUStatService/
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, date
from .base import BaseConnector, ConnectorResult
import logging

logger = logging.getLogger(__name__)


class NBUFXConnector(BaseConnector):
    """
    Connector for NBU Exchange Rates API
    API Docs: https://bank.gov.ua/ua/open-data/api-dev
    """
    
    def __init__(self):
        super().__init__(
            name="NBU Exchange Rates",
            base_url="https://bank.gov.ua/NBUStatService/v1",
            timeout=15.0
        )
    
    async def search(
        self,
        query: str,
        limit: int = 20,
        **kwargs
    ) -> ConnectorResult:
        """
        Search exchange rates by currency code
        
        Args:
            query: Currency code (USD, EUR, etc.)
            limit: Not used for this API
        """
        return await self.get_rate(query.upper())
    
    async def get_by_id(self, currency_code: str) -> ConnectorResult:
        """Get exchange rate by currency code"""
        return await self.get_rate(currency_code)
    
    async def get_rate(
        self,
        currency_code: str = "USD",
        rate_date: Optional[date] = None
    ) -> ConnectorResult:
        """
        Get exchange rate for specific currency
        
        Args:
            currency_code: ISO 4217 currency code (USD, EUR, PLN, etc.)
            rate_date: Date for historical rate (default: today)
        """
        params = {
            "valcode": currency_code.upper(),
            "json": ""
        }
        
        if rate_date:
            params["date"] = rate_date.strftime("%Y%m%d")
        
        result = await self._request("GET", "/statdirectory/exchange", params=params)
        
        if result.success and result.data:
            # NBU returns array, take first item
            if isinstance(result.data, list) and len(result.data) > 0:
                rate_data = result.data[0]
                result.data = {
                    "currency": rate_data.get("cc"),
                    "name": rate_data.get("txt"),
                    "rate": rate_data.get("rate"),
                    "date": rate_data.get("exchangedate"),
                    "r030": rate_data.get("r030")
                }
                result.records_count = 1
        
        return result
    
    async def get_all_rates(self, rate_date: Optional[date] = None) -> ConnectorResult:
        """Get all exchange rates for a date"""
        params = {"json": ""}
        
        if rate_date:
            params["date"] = rate_date.strftime("%Y%m%d")
        
        result = await self._request("GET", "/statdirectory/exchange", params=params)
        
        if result.success and result.data:
            result.records_count = len(result.data)
        
        return result
    
    async def get_usd_rate(self) -> Optional[float]:
        """Quick method to get current USD rate"""
        result = await self.get_rate("USD")
        if result.success and result.data:
            return result.data.get("rate")
        return None
    
    async def get_eur_rate(self) -> Optional[float]:
        """Quick method to get current EUR rate"""
        result = await self.get_rate("EUR")
        if result.success and result.data:
            return result.data.get("rate")
        return None


# Singleton instance
nbu_fx_connector = NBUFXConnector()
