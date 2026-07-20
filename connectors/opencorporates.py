import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager

class OpenCorporatesConnector:
    BASE_URL = "https://api.opencorporates.com"
    
    def __init__(self, api_key: str = None):
        self.manager = RegistryManager()
        self.api_key = api_key
        self.params = {"api_token": self.api_key} if api_key else {}
    
    def health_check(self):
        try:
            r = requests.get(f"{self.BASE_URL}/companies/search", params={"q": "test", **self.params})
            return r.status_code in (200, 401)
        except:
            return False
    
    def search_company(self, company_name: str = "Microsoft", jurisdiction: str = "ua"):
        params = {"q": company_name, "jurisdiction_code": jurisdiction, "per_page": 50, **self.params}
        resp = requests.get(f"{self.BASE_URL}/companies/search", params=params)
        data = resp.json()
        
        results = data.get("results", {}).get("companies", [])
        
        raw_data = json.dumps(results).encode('utf-8')
        filename = f"opencorporates_{company_name}_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("opencorporates", raw_data, filename)
        
        print(f"✅ OpenCorporates: знайдено {len(results)} компаній")
        return results
    
    def full_etl(self):
        self.search_company("ПриватБанк", "ua")
        self.search_company("", "ua")
        self._normalize_and_store()
    
    def _normalize_and_store(self):
        print("🔄 Нормалізація OpenCorporates (компанії, директори, бенефіціари по всьому світу)...")
