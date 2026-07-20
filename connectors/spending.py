import requests
import json
from datetime import datetime, timedelta
from connectors.registry_manager import RegistryManager
import time

class SpendingConnector:
    BASE_URL = "https://api.spending.gov.ua"
    
    def __init__(self):
        self.manager = RegistryManager()
        self.session = requests.Session()
    
    def health_check(self):
        try:
            r = self.session.get(f"{self.BASE_URL}/rest/transactions", params={"limit": 1})
            return r.status_code in (200, 401)
        except:
            return False
    
    def incremental_sync(self, days_back: int = 1):
        since = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        offset = 0
        all_transactions = []
        limit = 1000
        
        while True:
            params = {
                "date_from": since,
                "offset": offset,
                "limit": limit
            }
            resp = self.session.get(f"{self.BASE_URL}/rest/transactions", params=params)
            
            if resp.status_code != 200:
                print(f"❌ Error: {resp.status_code}")
                break
                
            data = resp.json()
            transactions = data if isinstance(data, list) else data.get("data", [])
            all_transactions.extend(transactions)
            
            if len(transactions) < limit:
                break
                
            offset += limit
            time.sleep(0.3)
        
        raw_data = json.dumps(all_transactions).encode('utf-8')
        filename = f"transactions_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.json"
        self.manager.save_raw("spending", raw_data, filename)
        
        print(f"✅ Spending.gov.ua: завантажено {len(all_transactions)} транзакцій")
        return all_transactions
    
    def full_etl(self):
        transactions = self.incremental_sync(days_back=7)
        self._normalize_and_store(transactions)
    
    def _normalize_and_store(self, transactions):
        print("🔄 Нормалізація Spending даних...")
