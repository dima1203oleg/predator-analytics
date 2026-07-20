import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager

class NbuConnector:
    BASE_URL = "https://bank.gov.ua"
    
    def __init__(self):
        self.manager = RegistryManager()
    
    def health_check(self):
        try:
            r = requests.get(f"{self.BASE_URL}/NBUStatService/v1/statdirectory/exchange")
            return r.status_code == 200
        except:
            return False
    
    def get_exchange_rates(self):
        resp = requests.get(f"{self.BASE_URL}/NBUStatService/v1/statdirectory/exchange?json")
        rates = resp.json()
        
        raw_data = json.dumps(rates).encode('utf-8')
        filename = f"nbu_rates_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("nbu", raw_data, filename)
        
        print(f"✅ НБУ: завантажено {len(rates)} курсів валют")
        return rates
    
    def get_financial_stats(self):
        print("📊 Завантаження фінансової статистики НБУ...")
    
    def full_etl(self):
        self.get_exchange_rates()
        self.get_financial_stats()
        self._normalize_and_store()
    
    def _normalize_and_store(self):
        print("🔄 Нормалізація даних НБУ (курси, статистика банків)...")
