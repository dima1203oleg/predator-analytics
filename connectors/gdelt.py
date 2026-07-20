import requests
import json
from datetime import datetime, timedelta
from connectors.registry_manager import RegistryManager

class GdeltConnector:
    BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
    
    def __init__(self):
        self.manager = RegistryManager()
    
    def health_check(self):
        try:
            r = requests.get("https://api.gdeltproject.org/api/v2/doc/doc?query=ukraine&mode=artlist&maxrecords=1")
            return r.status_code == 200
        except:
            return False
    
    def search_events(self, keyword: str = "Ukraine OR корупція OR санкції", days_back: int = 1):
        end = datetime.utcnow()
        start = end - timedelta(days=days_back)
        
        params = {
            "query": keyword,
            "mode": "artlist",
            "maxrecords": 250,
            "format": "json",
            "startdatetime": start.strftime("%Y%m%d%H%M%S"),
            "enddatetime": end.strftime("%Y%m%d%H%M%S")
        }
        
        resp = requests.get(self.BASE_URL, params=params)
        data = resp.json()
        
        articles = data.get("articles", [])
        
        raw_data = json.dumps(articles).encode('utf-8')
        filename = f"gdelt_{keyword.replace(' ', '_')}_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("gdelt", raw_data, filename)
        
        print(f"✅ GDELT: завантажено {len(articles)} подій/статей")
        return articles
    
    def full_etl(self):
        self.search_events("Ukraine sanctions OR corruption OR tender")
        self.search_events("PEP OR чиновник")
        self._normalize_and_store()
    
    def _normalize_and_store(self):
        print("🔄 Нормалізація GDELT (тональність, згадки, гео)...")
