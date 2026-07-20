import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager

class RnboSanctionsConnector:
    BASE_URL = "https://drs.nsdc.gov.ua"
    
    def __init__(self):
        self.manager = RegistryManager()
    
    def health_check(self):
        try:
            r = requests.get(f"{self.BASE_URL}/api/public/sanctions", params={"limit": 1})
            return r.status_code == 200
        except:
            return False
    
    def full_sync(self):
        params = {"limit": 1000, "offset": 0}
        all_sanctions = []
        
        while True:
            resp = requests.get(f"{self.BASE_URL}/api/public/sanctions", params=params)
            if resp.status_code != 200:
                break
            data = resp.json()
            batch = data.get("items", []) if isinstance(data, dict) else data
            all_sanctions.extend(batch)
            
            if len(batch) < 1000:
                break
            params["offset"] += 1000
        
        raw_data = json.dumps(all_sanctions).encode('utf-8')
        filename = f"rnbo_sanctions_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("rnbo", raw_data, filename)
        
        print(f"✅ РНБО: завантажено {len(all_sanctions)} записів санкцій")
        return all_sanctions
    
    def full_etl(self):
        data = self.full_sync()
        self._normalize_and_store(data)
    
    def _normalize_and_store(self, data):
        print("🔄 Нормалізація РНБО санкцій (фіз/юр особи, судна, активи)...")
