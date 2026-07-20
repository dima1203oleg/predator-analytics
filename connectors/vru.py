import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager

class VruConnector:
    BASE_URL = "https://data.rada.gov.ua"
    
    def __init__(self):
        self.manager = RegistryManager()
    
    def health_check(self):
        try:
            r = requests.get(f"{self.BASE_URL}/api/v1/bills", params={"limit": 1})
            return r.status_code == 200
        except:
            return False
    
    def sync_bills(self, days_back: int = 30):
        params = {"limit": 500, "offset": 0}
        all_bills = []
        
        while True:
            resp = requests.get(f"{self.BASE_URL}/api/v1/bills", params=params)
            data = resp.json()
            bills = data.get("data", []) if isinstance(data, dict) else data
            all_bills.extend(bills)
            
            if len(bills) < 500:
                break
            params["offset"] += 500
        
        raw_data = json.dumps(all_bills).encode('utf-8')
        filename = f"vru_bills_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("vru", raw_data, filename)
        
        print(f"✅ ВРУ: завантажено {len(all_bills)} законопроєктів/голосувань")
        return all_bills
    
    def sync_deputies(self):
        resp = requests.get(f"{self.BASE_URL}/api/v1/deputies")
        deputies = resp.json()
        self.manager.save_raw("vru", json.dumps(deputies).encode('utf-8'), "deputies.json")
        print(f"✅ ВРУ: завантажено {len(deputies)} депутатів")
    
    def full_etl(self):
        self.sync_bills()
        self.sync_deputies()
        self._normalize_and_store()
    
    def _normalize_and_store(self):
        print("🔄 Нормалізація даних ВРУ (законодавство, голосування, депутати)...")
