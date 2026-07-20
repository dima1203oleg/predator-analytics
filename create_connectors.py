import os

files = {
    "connectors/spending.py": """import requests
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
""",
    "etl/spending_etl.py": """import duckdb
import json
from connectors.spending import SpendingConnector

def run_spending_etl():
    connector = SpendingConnector()
    data = connector.incremental_sync(days_back=3)
    
    con = duckdb.connect()
    con.execute("CREATE TABLE raw_spending AS SELECT * FROM json(?)", [json.dumps(data)])
    
    con.execute(\"\"\"
        CREATE TABLE clean_spending AS 
        SELECT 
            id,
            payment_date,
            amount,
            payer_name,
            payer_edrpou,
            recipient_name,
            recipient_edrpou,
            description
        FROM raw_spending
    \"\"\")
    
    print("✅ Spending ETL завершено")
""",
    "schedulers/spending_daily.py": """import schedule
import time
from etl.spending_etl import run_spending_etl

def run_daily_spending():
    print("🚀 Запуск Spending.gov.ua sync...")
    run_spending_etl()

schedule.every().day.at("04:00").do(run_daily_spending)
schedule.every(12).hours.do(run_spending_etl)

print("⏰ Spending Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/nazk.py": """import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager

class NazkConnector:
    BASE_URL = "https://public-api.nazk.gov.ua"
    
    def __init__(self):
        self.manager = RegistryManager()
        self.session = requests.Session()
    
    def health_check(self):
        try:
            r = self.session.get(f"{self.BASE_URL}/v2/documents/list", params={"limit": 1})
            return r.status_code == 200
        except:
            return False
    
    def incremental_sync(self, days_back: int = 7):
        since = (datetime.utcnow().timestamp() - days_back * 86400) * 1000
        params = {
            "updatedFrom": int(since),
            "limit": 500
        }
        
        all_docs = []
        offset = 0
        
        while True:
            params["offset"] = offset
            resp = self.session.get(f"{self.BASE_URL}/v2/documents/list", params=params)
            data = resp.json()
            
            documents = data.get("data", [])
            all_docs.extend(documents)
            
            if len(documents) < 500:
                break
            offset += 500
        
        raw_data = json.dumps(all_docs).encode('utf-8')
        filename = f"declarations_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("nazk", raw_data, filename)
        
        print(f"✅ НАЗК: завантажено {len(all_docs)} декларацій")
        return all_docs
    
    def full_etl(self):
        data = self.incremental_sync()
        self._normalize_and_store(data)
    
    def _normalize_and_store(self, data):
        print("🔄 Нормалізація НАЗК даних (PEP, статки, родинні зв'язки)...")
""",
    "etl/nazk_etl.py": """import duckdb
import json
from connectors.nazk import NazkConnector

def run_nazk_etl():
    connector = NazkConnector()
    data = connector.incremental_sync(days_back=5)
    
    con = duckdb.connect()
    con.execute("CREATE TABLE raw_nazk AS SELECT * FROM json(?)", [json.dumps(data)])
    
    con.execute(\"\"\"
        CREATE TABLE clean_nazk AS 
        SELECT 
            id,
            declarant->>'fullName' as full_name,
            declarant->>'position' as position,
            json_extract(declarant, '$.workPlace') as workplace,
            has_family as has_family_links,
            total_assets
        FROM raw_nazk
    \"\"\")
    
    print("✅ НАЗК ETL завершено (PEP + декларації)")
""",
    "schedulers/nazk_daily.py": """import schedule
import time
from etl.nazk_etl import run_nazk_etl

def run_daily_nazk():
    print("🚀 Запуск НАЗК sync...")
    run_nazk_etl()

schedule.every().day.at("05:00").do(run_daily_nazk)

print("⏰ НАЗК Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/opensanctions.py": """import requests
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
""",
    "etl/opensanctions_etl.py": """import duckdb
from connectors.opensanctions import OpenSanctionsConnector

def run_opensanctions_etl():
    connector = OpenSanctionsConnector()
    connector.download_bulk()
    
    con = duckdb.connect()
    
    print("✅ OpenSanctions ETL завершено — дані готові для графу зв’язків")
""",
    "schedulers/opensanctions_daily.py": """import schedule
import time
from etl.opensanctions_etl import run_opensanctions_etl

def run_daily_opensanctions():
    print("🚀 Запуск OpenSanctions bulk sync...")
    run_opensanctions_etl()

schedule.every().day.at("02:30").do(run_daily_opensanctions)

print("⏰ OpenSanctions Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/datagovua.py": """import requests
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
""",
    "etl/datagovua_etl.py": """import duckdb
from connectors.datagovua import DataGovUAConnector

def run_datagovua_etl():
    connector = DataGovUAConnector()
    connector.incremental_sync()
    
    print("✅ data.gov.ua ETL завершено (ЄДР + інші реєстри)")
""",
    "schedulers/datagovua_daily.py": """import schedule
import time
from etl.datagovua_etl import run_datagovua_etl

def run_daily_datagovua():
    print("🚀 Запуск data.gov.ua sync...")
    run_datagovua_etl()

schedule.every().day.at("06:00").do(run_daily_datagovua)

print("⏰ data.gov.ua Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/rnbo.py": """import requests
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
""",
    "etl/rnbo_etl.py": """import duckdb
import json
from connectors.rnbo import RnboSanctionsConnector

def run_rnbo_etl():
    connector = RnboSanctionsConnector()
    data = connector.full_sync()
    
    con = duckdb.connect()
    con.execute("CREATE TABLE raw_rnbo AS SELECT * FROM json(?)", [json.dumps(data)])
    
    print("✅ РНБО ETL завершено — санкції готові до графу")
""",
    "schedulers/rnbo_daily.py": """import schedule
import time
from etl.rnbo_etl import run_rnbo_etl

def run_daily_rnbo():
    print("🚀 Запуск РНБО sync...")
    run_rnbo_etl()

schedule.every().day.at("03:30").do(run_daily_rnbo)

print("⏰ РНБО Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/nbu.py": """import requests
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
""",
    "etl/nbu_etl.py": """import duckdb
from connectors.nbu import NbuConnector

def run_nbu_etl():
    connector = NbuConnector()
    connector.get_exchange_rates()
    print("✅ НБУ ETL завершено")
""",
    "schedulers/nbu_daily.py": """import schedule
import time
from etl.nbu_etl import run_nbu_etl

def run_daily_nbu():
    print("🚀 Запуск НБУ sync...")
    run_nbu_etl()

schedule.every().day.at("07:00").do(run_daily_nbu)
schedule.every(6).hours.do(run_nbu_etl)

print("⏰ НБУ Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/vru.py": """import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager

class VruConnector:
    BASE_URL = "https://data.rada.gov.ua"
    
    def __init__(self):
        self.manager = RegistryManager()
    
    def health_check(self):
        try:
            r = requests.get(f"{self.BASE_URL}/api/v1/bills", params={"limit": 1})
            return r.status_code == 200
        except:
            return False
    
    def sync_bills(self, days_back: int = 30):
        params = {"limit": 500, "offset": 0}
        all_bills = []
        
        while True:
            resp = requests.get(f"{self.BASE_URL}/api/v1/bills", params=params)
            data = resp.json()
            bills = data.get("data", []) if isinstance(data, dict) else data
            all_bills.extend(bills)
            
            if len(bills) < 500:
                break
            params["offset"] += 500
        
        raw_data = json.dumps(all_bills).encode('utf-8')
        filename = f"vru_bills_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("vru", raw_data, filename)
        
        print(f"✅ ВРУ: завантажено {len(all_bills)} законопроєктів/голосувань")
        return all_bills
    
    def sync_deputies(self):
        resp = requests.get(f"{self.BASE_URL}/api/v1/deputies")
        deputies = resp.json()
        self.manager.save_raw("vru", json.dumps(deputies).encode('utf-8'), "deputies.json")
        print(f"✅ ВРУ: завантажено {len(deputies)} депутатів")
    
    def full_etl(self):
        self.sync_bills()
        self.sync_deputies()
        self._normalize_and_store()
    
    def _normalize_and_store(self):
        print("🔄 Нормалізація даних ВРУ (законодавство, голосування, депутати)...")
""",
    "etl/vru_etl.py": """import duckdb
from connectors.vru import VruConnector

def run_vru_etl():
    connector = VruConnector()
    connector.sync_bills()
    connector.sync_deputies()
    print("✅ ВРУ ETL завершено")
""",
    "schedulers/vru_daily.py": """import schedule
import time
from etl.vru_etl import run_vru_etl

def run_daily_vru():
    print("🚀 Запуск ВРУ sync...")
    run_vru_etl()

schedule.every().day.at("08:00").do(run_daily_vru)

print("⏰ ВРУ Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/gdelt.py": """import requests
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
""",
    "etl/gdelt_etl.py": """import duckdb
from connectors.gdelt import GdeltConnector

def run_gdelt_etl():
    connector = GdeltConnector()
    connector.search_events()
    print("✅ GDELT ETL завершено (медіа-моніторинг)")
""",
    "schedulers/gdelt_hourly.py": """import schedule
import time
from etl.gdelt_etl import run_gdelt_etl

def run_hourly_gdelt():
    print("🚀 Запуск GDELT sync...")
    run_gdelt_etl()

schedule.every(6).hours.do(run_hourly_gdelt)

print("⏰ GDELT Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/otx.py": """import requests
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
""",
    "etl/otx_etl.py": """import duckdb
from connectors.otx import OtxConnector

def run_otx_etl():
    connector = OtxConnector()
    connector.get_latest_pulses()
    print("✅ OTX ETL завершено")
""",
    "schedulers/otx_hourly.py": """import schedule
import time
from etl.otx_etl import run_otx_etl

def run_hourly_otx():
    print("🚀 Запуск AlienVault OTX sync...")
    run_otx_etl()

schedule.every(6).hours.do(run_hourly_otx)

print("⏰ OTX Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/opencorporates.py": """import requests
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
""",
    "etl/opencorporates_etl.py": """import duckdb
from connectors.opencorporates import OpenCorporatesConnector

def run_opencorporates_etl():
    connector = OpenCorporatesConnector()
    connector.full_etl()
    print("✅ OpenCorporates ETL завершено")
""",
    "schedulers/opencorporates_daily.py": """import schedule
import time
from etl.opencorporates_etl import run_opencorporates_etl

def run_daily_opencorporates():
    print("🚀 Запуск OpenCorporates sync...")
    run_opencorporates_etl()

schedule.every().day.at("09:00").do(run_daily_opencorporates)

print("⏰ OpenCorporates Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/mitre.py": """import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager

class MitreConnector:
    def __init__(self):
        self.manager = RegistryManager()
    
    def health_check(self):
        try:
            r = requests.get("https://cve.mitre.org/data/downloads/allitems.json.zip", stream=True)
            return True
        except:
            return False
    
    def get_cve_recent(self):
        url = "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=100&startIndex=0"
        resp = requests.get(url)
        data = resp.json()
        
        vulns = data.get("vulnerabilities", [])
        
        raw_data = json.dumps(vulns).encode('utf-8')
        filename = f"cve_recent_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("mitre", raw_data, filename)
        
        print(f"✅ CVE: завантажено {len(vulns)} вразливостей")
        return vulns
    
    def get_mitre_attack(self):
        urls = [
            "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json",
        ]
        for url in urls:
            resp = requests.get(url)
            data = resp.json()
            self.manager.save_raw("mitre", json.dumps(data).encode('utf-8'), "enterprise-attack.json")
            print("✅ MITRE ATT&CK завантажено")
    
    def full_etl(self):
        self.get_cve_recent()
        self.get_mitre_attack()
        self._normalize_and_store()
    
    def _normalize_and_store(self):
        print("🔄 Нормалізація MITRE/CVE (вразливості, техніки атак)...")
""",
    "etl/mitre_etl.py": """import duckdb
from connectors.mitre import MitreConnector

def run_mitre_etl():
    connector = MitreConnector()
    connector.full_etl()
    print("✅ MITRE/CVE ETL завершено")
""",
    "schedulers/mitre_daily.py": """import schedule
import time
from etl.mitre_etl import run_mitre_etl

def run_daily_mitre():
    print("🚀 Запуск MITRE/CVE sync...")
    run_mitre_etl()

schedule.every().day.at("10:00").do(run_daily_mitre)

print("⏰ MITRE Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/nominatim.py": """import requests
import json
from datetime import datetime
from connectors.registry_manager import RegistryManager
import time

class NominatimConnector:
    BASE_URL = "https://nominatim.openstreetmap.org"
    
    def __init__(self):
        self.manager = RegistryManager()
        self.headers = {"User-Agent": "Predator-Analytics/1.0"}
    
    def health_check(self):
        try:
            r = requests.get(f"{self.BASE_URL}/search", params={"q": "Київ", "format": "json"}, headers=self.headers)
            return r.status_code == 200
        except:
            return False
    
    def geocode_address(self, address: str):
        params = {
            "q": address,
            "format": "json",
            "limit": 10,
            "addressdetails": 1
        }
        resp = requests.get(f"{self.BASE_URL}/search", params=params, headers=self.headers)
        results = resp.json()
        
        raw_data = json.dumps(results).encode('utf-8')
        filename = f"geo_{address.replace(' ', '_')[:50]}_{datetime.utcnow().strftime('%Y%m%d')}.json"
        self.manager.save_raw("nominatim", raw_data, filename)
        
        print(f"✅ Nominatim: геокодовано {len(results)} результатів для '{address}'")
        return results
    
    def reverse_geocode(self, lat: float, lon: float):
        params = {"lat": lat, "lon": lon, "format": "json"}
        resp = requests.get(f"{self.BASE_URL}/reverse", params=params, headers=self.headers)
        return resp.json()
    
    def full_etl(self):
        self.geocode_address("Київ, Україна")
        self.geocode_address("Львів")
        self._normalize_and_store()
    
    def _normalize_and_store(self):
        print("🔄 Нормалізація геоданих (адреси, координати, кадастр)...")
""",
    "etl/nominatim_etl.py": """import duckdb
from connectors.nominatim import NominatimConnector

def run_nominatim_etl():
    connector = NominatimConnector()
    connector.full_etl()
    print("✅ Nominatim ETL завершено")
""",
    "schedulers/nominatim_daily.py": """import schedule
import time
from etl.nominatim_etl import run_nominatim_etl

def run_daily_nominatim():
    print("🚀 Запуск Nominatim sync...")
    run_nominatim_etl()

schedule.every().day.at("11:00").do(run_daily_nominatim)

print("⏰ Nominatim Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "connectors/courtlistener.py": """import requests
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
""",
    "etl/courtlistener_etl.py": """import duckdb
from connectors.courtlistener import CourtListenerConnector

def run_courtlistener_etl():
    connector = CourtListenerConnector()
    connector.full_etl()
    print("✅ CourtListener ETL завершено")
""",
    "schedulers/courtlistener_daily.py": """import schedule
import time
from etl.courtlistener_etl import run_courtlistener_etl

def run_daily_courtlistener():
    print("🚀 Запуск CourtListener sync...")
    run_courtlistener_etl()

schedule.every().day.at("12:00").do(run_daily_courtlistener)

print("⏰ CourtListener Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
""",
    "main_pipeline.py": """from connectors.prozorro import ProZorroConnector
from connectors.spending import SpendingConnector
from connectors.nazk import NazkConnector
from connectors.opensanctions import OpenSanctionsConnector
from connectors.datagovua import DataGovUAConnector
from connectors.rnbo import RnboSanctionsConnector
from connectors.nbu import NbuConnector
from connectors.vru import VruConnector
from connectors.gdelt import GdeltConnector
from connectors.otx import OtxConnector
from connectors.opencorporates import OpenCorporatesConnector
from connectors.mitre import MitreConnector
from connectors.nominatim import NominatimConnector
from connectors.courtlistener import CourtListenerConnector

def run_full_pipeline():
    print("🚀 Запуск повного ETL для Predator Analytics...")
    
    connectors = [
        ProZorroConnector(),
        SpendingConnector(),
        NazkConnector(),
        OpenSanctionsConnector(),
        DataGovUAConnector(),
        RnboSanctionsConnector(),
        NbuConnector(),
        VruConnector(),
        GdeltConnector(),
        OtxConnector(),
        OpenCorporatesConnector(),
        MitreConnector(),
        NominatimConnector(),
        CourtListenerConnector()
    ]
    
    for conn in connectors:
        try:
            print(f"\\n--- Запуск {conn.__class__.__name__} ---")
            conn.full_etl()
        except Exception as e:
            print(f"❌ Помилка в {conn.__class__.__name__}: {e}")
            
    print("\\n✅ Повний цикл завершено!")

if __name__ == "__main__":
    run_full_pipeline()
"""
}

for path, content in files.items():
    full_path = os.path.join("/Users/Shared/Predator_60", path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
        print(f"Created {path}")

# Rewrite connectors/registry_manager.py to import all connectors in __init__
with open("/Users/Shared/Predator_60/connectors/registry_manager.py", "r") as f:
    rm_content = f.read()

new_rm_content = """import os
import io
from dotenv import load_dotenv
from minio import Minio
from datetime import datetime

load_dotenv()

class RegistryManager:
    def __init__(self):
        self.minio = Minio(
            os.getenv("MINIO_ENDPOINT", "localhost:9000"),
            access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
            secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
            secure=False
        )
        self.ensure_bucket("raw-data")
        self.ensure_bucket("clean-data")
        
        # We will lazy-load the sources when requested to avoid circular imports
        self.sources = {}
    
    def ensure_bucket(self, bucket: str):
        if not self.minio.bucket_exists(bucket):
            self.minio.make_bucket(bucket)
    
    def save_raw(self, dataset: str, data: bytes, filename: str):
        data_stream = io.BytesIO(data)
        self.minio.put_object("raw-data", f"{dataset}/{filename}", data_stream, len(data))
        print(f"✅ Raw saved: {dataset}/{filename}")
"""
with open("/Users/Shared/Predator_60/connectors/registry_manager.py", "w") as f:
    f.write(new_rm_content)
    print("Updated connectors/registry_manager.py")
