import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager

class OpenSanctionsConnector:
    BULK_BASE = "https://data.opensanctions.org/datasets/latest/default"
    
    def __init__(self):
        self.manager = RegistryManager()
    
    def health_check(self):
        try:
            r = requests.head(f"{self.BULK_BASE}/entities.ftm.json")
            return r.status_code == 200
        except:
            return False
    
    def download_bulk(self):
        urls = {
            "entities": f"{self.BULK_BASE}/entities.ftm.json",
            "targets": f"{self.BULK_BASE}/targets.simple.csv"
        }
        
        for name, url in urls.items():
            print(f"📥 Завантаження {name}...")
            resp = requests.get(url, stream=True)
            if resp.status_code == 200:
                data = resp.content
                filename = f"{name}_{datetime.utcnow().strftime('%Y%m%d')}.json" if "json" in url else f"{name}.csv"
                self.manager.save_raw("opensanctions", data, filename)
                print(f"✅ Збережено {name} ({len(data) // (1024*1024)} MB)")
        
        return True
    
    def incremental_sync(self):
        print("🔍 OpenSanctions API готовий для screening")
        return self.download_bulk()
    
    def full_etl(self):
        self.download_bulk()
        self._normalize_and_store()
    
    def _normalize_and_store(self):
        print("🔄 Нормалізація OpenSanctions (Sanctions + PEP + Companies)...")
