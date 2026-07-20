"""
OSINT Normalizer — PREDATOR Registry Manager
Розбирає результати від YouControl, Clearbit для збагачення сутності Company.
"""
import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

class OsintNormalizer:
    @staticmethod
    def normalize_youcontrol(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Перетворює досьє YouControl у формат для злиття (Merge) з існуючим вузлом.
        """
        edrpou = raw_data.get("edrpou")
        
        enrichment = {
            "entity_type": "Company",
            "ueid": f"UA-EDR-{edrpou}",
            "status": raw_data.get("status"),
            "vat_payer": raw_data.get("vat_payer"),
            "risk_score": raw_data.get("risk_score"),
            "relations": []
        }
        
        # Витягуємо директора
        director = raw_data.get("director")
        if director:
            enrichment["relations"].append({
                "type": "DIRECTOR_OF",
                "target": {
                    "entity_type": "Person",
                    "ueid": f"UA-INN-{director.get('inn')}",
                    "name": director.get("name")
                }
            })
            
        # Витягуємо засновників
        for founder in raw_data.get("founders", []):
            enrichment["relations"].append({
                "type": "FOUNDER_OF",
                "target": {
                    "entity_type": "Company",
                    "ueid": f"UA-EDR-{founder.get('edrpou')}",
                    "name": founder.get("name")
                }
            })
            
        return enrichment

    @staticmethod
    def normalize_clearbit(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Перетворює дані Clearbit у формат для злиття.
        """
        domain = raw_data.get("domain")
        
        enrichment = {
            "entity_type": "Company",
            "domain": domain,
            "industry": raw_data.get("category", {}).get("industryGroup"),
            "employees": raw_data.get("metrics", {}).get("employees"),
            "logo_url": raw_data.get("logo")
        }
        
        return enrichment
