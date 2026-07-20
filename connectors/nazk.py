import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager

class NazkConnector:
    BASE_URL = "https://public-api.nazk.gov.ua"
    
    def __init__(self):
        self.manager = RegistryManager()
        self.session = requests.Session()
    
    def health_check(self):
        try:
            r = self.session.get(f"{self.BASE_URL}/v2/documents/list", params={"limit": 1})
            return r.status_code == 200
        except:
            return False
    
    def incremental_sync(self, days_back: int = 7):
        since = (datetime.utcnow().timestamp() - days_back * 86400) * 1000
        params = {
            "updatedFrom": int(since),
            "limit": 500
        }
        
        all_docs = []
        offset = 0
        
        while True:
            params["offset"] = offset
            resp = self.session.get(f"{self.BASE_URL}/v2/documents/list", params=params)
            data = resp.json()
            
            documents = data.get("data", [])
            all_docs.extend(documents)
            
            if len(documents) < 500:
                break
            offset += 500
        
        raw_data = json.dumps(all_docs).encode('utf-8')
        filename = f"declarations_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("nazk", raw_data, filename)
        
        print(f"✅ НАЗК: завантажено {len(all_docs)} декларацій")
        return all_docs
    
    def full_etl(self):
        data = self.incremental_sync()
        self._normalize_and_store(data)
    
    def _normalize_and_store(self, data):
        print("🔄 Нормалізація НАЗК даних (PEP, статки, родинні зв'язки)...")
