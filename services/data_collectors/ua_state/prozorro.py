import requests
import json
import logging
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prozorro-collector")

class ProzorroCollector:
    """
    Офіційний колектор даних Prozorro (api.prozorro.gov.ua).
    Використовує публічний API для отримання тендерів.
    """
    
    BASE_URL = "https://public.api.openprocurement.org/api/2.5"
    
    def __init__(self):
        self.session = requests.Session()
        # Prozorro API не вимагає токена по замовчуванню для публічних даних
    
    def fetch_tenders(self, offset: str = "", limit: int = 10) -> Dict[str, Any]:
        """
        Завантажує список тендерів з пагінацією.
        """
        url = f"{self.BASE_URL}/tenders"
        params = {
            "offset": offset,
            "limit": limit,
            "descending": 1
        }
        
        try:
            logger.info(f"Fetching tenders from Prozorro... offset={offset}")
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data
        except Exception as e:
            logger.error(f"Failed to fetch tenders: {e}")
            return {"data": [], "next_page": {"offset": offset}}

    def get_tender_details(self, tender_id: str) -> Optional[Dict[str, Any]]:
        """
        Отримує повну інформацію про конкретний тендер.
        """
        url = f"{self.BASE_URL}/tenders/{tender_id}"
        
        try:
            logger.info(f"Fetching tender detail: {tender_id}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return response.json().get("data")
        except Exception as e:
            logger.error(f"Failed to fetch tender {tender_id}: {e}")
            return None

if __name__ == "__main__":
    # Smoke test
    collector = ProzorroCollector()
    tenders = collector.fetch_tenders(limit=5)
    print(f"Fetched {len(tenders.get('data', []))} tenders.")
    
    if tenders.get('data'):
        first_id = tenders['data'][0]['id']
        details = collector.get_tender_details(first_id)
        if details:
            print(f"Sample Tender: {details.get('title', 'No title')}")
            print(f"Value: {details.get('value', {}).get('amount')} {details.get('value', {}).get('currency')}")
            print(f"Status: {details.get('status')}")
