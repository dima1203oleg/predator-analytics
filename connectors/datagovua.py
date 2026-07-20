import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager

class DataGovUAConnector:
    BASE_URL = "https://data.gov.ua/api/3"
    
    def __init__(self):
        self.manager = RegistryManager()
    
    def health_check(self):
        try:
            r = requests.get(f"{self.BASE_URL}/action/package_list", params={"limit": 1})
            return r.status_code == 200
        except:
            return False
    
    def get_edr_dump(self):
        search = requests.get(f"{self.BASE_URL}/action/package_search", 
                            params={"q": "Єдиний державний реєстр юридичних осіб та фізичних осіб-підприємців"}).json()
        
        if search["result"]["results"]:
            dataset = search["result"]["results"][0]
            resources = dataset.get("resources", [])
            
            for res in resources:
                if "json" in res["format"].lower() or "csv" in res["format"].lower():
                    url = res["url"]
                    print(f"📥 Завантаження {res['name']}...")
                    resp = requests.get(url, stream=True)
                    data = resp.content
                    filename = f"edr_{datetime.utcnow().strftime('%Y%m%d')}.{res['format'].lower()}"
                    self.manager.save_raw("datagovua", data, filename)
                    print(f"✅ Збережено {filename}")
    
    def incremental_sync(self):
        self.get_edr_dump()
        return True
    
    def full_etl(self):
        self.incremental_sync()
        self._normalize_and_store()
    
    def _normalize_and_store(self):
        print("🔄 Нормалізація ЄДР (компанії, ФОП, бенефіціари)...")
