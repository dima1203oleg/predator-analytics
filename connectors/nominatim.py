import requests
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
