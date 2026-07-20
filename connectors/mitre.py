import requests
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
