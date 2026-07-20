import requests
import json
from datetime import datetime, timedelta
from connectors.registry_manager import RegistryManager
import time

class ProZorroConnector:
    BASE_URL = "https://public-api.prozorro.gov.ua/api/2.5"
    
    def __init__(self):
        self.manager = RegistryManager()
        self.session = requests.Session()
    
    def health_check(self):
        try:
            r = self.session.get(f"{self.BASE_URL}/tenders", params={"limit": 1})
            return r.status_code == 200
        except:
            return False
    
    def incremental_sync(self, days_back: int = 1):
        """Інкрементальне завантаження (рекомендовано)"""
        since = (datetime.utcnow() - timedelta(days=days_back)).isoformat()
        offset = None
        all_tenders = []
        
        while True:
            params = {"offset": offset} if offset else {"offset": since}
            resp = self.session.get(f"{self.BASE_URL}/tenders", params=params, timeout=30)
            data = resp.json()
            
            tenders = data.get("data", [])
            all_tenders.extend(tenders)
            
            if "next_page" not in data or not tenders:
                break
                
            offset = data["next_page"].get("offset")
            time.sleep(0.5)  # rate limit friendly
        
        # Збереження raw
        raw_data = json.dumps(all_tenders).encode('utf-8')
        filename = f"tenders_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.json"
        self.manager.save_raw("prozorro", raw_data, filename)
        
        print(f"✅ ProZorro: завантажено {len(all_tenders)} тендерів")
        return all_tenders
    
    def full_etl(self):
        """Повний цикл ETL"""
        tenders = self.incremental_sync(days_back=7)  # для першого запуску
        self._normalize_and_store(tenders)
    
    def _normalize_and_store(self, tenders):
        # Тут буде нормалізація + запис у БД (реалізуємо в etl/)
        print("🔄 Нормалізація та збереження в PostgreSQL/ClickHouse...")
        # TODO: виклик etl pipeline
