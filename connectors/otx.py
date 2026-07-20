import requests
import json
from datetime import datetime, timedelta
from connectors.registry_manager import RegistryManager

class OtxConnector:
    BASE_URL = "https://otx.alienvault.com/api/v1"
    
    def __init__(self, api_key: str = None):
        self.manager = RegistryManager()
        self.api_key = api_key or "YOUR_OTX_KEY"
        self.headers = {"X-OTX-API-KEY": self.api_key} if self.api_key != "YOUR_OTX_KEY" else {}
    
    def health_check(self):
        try:
            r = requests.get(f"{self.BASE_URL}/pulses/latest", headers=self.headers, params={"limit": 1})
            return r.status_code == 200
        except:
            return False
    
    def get_latest_pulses(self, days_back: int = 1):
        since = (datetime.utcnow() - timedelta(days=days_back)).isoformat()
        params = {"since": since, "limit": 50}
        
        resp = requests.get(f"{self.BASE_URL}/pulses/latest", headers=self.headers, params=params)
        pulses = resp.json().get("results", [])
        
        raw_data = json.dumps(pulses).encode('utf-8')
        filename = f"otx_pulses_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("otx", raw_data, filename)
        
        print(f"✅ AlienVault OTX: завантажено {len(pulses)} пульсів загроз")
        return pulses
    
    def search_ioc(self, ioc_type: str, value: str):
        resp = requests.get(f"{self.BASE_URL}/indicators/{ioc_type}/{value}", headers=self.headers)
        return resp.json()
    
    def full_etl(self):
        self.get_latest_pulses(days_back=2)
        self._normalize_and_store()
    
    def _normalize_and_store(self):
        print("🔄 Нормалізація OTX (IoC, malware, actors)...")
