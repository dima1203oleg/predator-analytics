import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager

class CourtListenerConnector:
    BASE_URL = "https://www.courtlistener.com/api/rest/v4"
    
    def __init__(self):
        self.manager = RegistryManager()
        self.headers = {"Authorization": "Token YOUR_TOKEN_HERE"}
    
    def search_cases(self, query: str = "Ukraine OR sanctions"):
        params = {"q": query, "limit": 100}
        resp = requests.get(f"{self.BASE_URL}/search/", params=params, headers=self.headers)
        data = resp.json()
        
        results = data.get("results", [])
        raw_data = json.dumps(results).encode('utf-8')
        filename = f"courtlistener_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("courtlistener", raw_data, filename)
        
        print(f"✅ CourtListener: знайдено {len(results)} судових справ")
        return results
    
    def full_etl(self):
        self.search_cases("Ukraine sanctions")
        self.search_cases("PEP OR oligarch")
        print("✅ CourtListener ETL завершено")
