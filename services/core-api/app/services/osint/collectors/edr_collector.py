from typing import Dict, Any, List
from app.services.osint.collectors.base import BaseOsintCollector
import asyncio

class EdrCollector(BaseOsintCollector):
    """
    Колектор Єдиного державного реєстру (ЄДР).
    Шукає компанії, засновників, бенефіціарів за ПІБ або РНОКПП особи.
    Симулює звернення до зовнішнього API (YouControl / Opendatabot / Дія).
    """

    def __init__(self):
        super().__init__(source_name="EDR_Registry")

    async def collect(self, query: str, **kwargs) -> Dict[str, Any]:
        """Симуляція запиту до ЄДР"""
        await asyncio.sleep(0.5) # Імітація мережевої затримки
        
        # Моковий відповідач
        if "іванов" in query.lower() or "ivanov" in query.lower():
            return {
                "search_query": query,
                "found_companies": [
                    {
                        "edrpou": "12345678",
                        "name": "ТОВ 'Рога і Копита'",
                        "status": "active",
                        "role": "founder",
                        "share_percent": 100,
                        "capital": 50000
                    },
                    {
                        "edrpou": "87654321",
                        "name": "ПРАТ 'БудІнвест'",
                        "status": "bankrupt",
                        "role": "beneficiary",
                        "share_percent": 25,
                        "capital": 1000000
                    }
                ]
            }
            
        return {"search_query": query, "found_companies": []}

    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Конвертує сиру відповідь ЄДР у формат графових вузлів (Nodes)
        та зв'язків (Edges) для інтеграції з Neo4j.
        """
        nodes = []
        edges = []
        dossier_updates = {"business_assets": []}
        
        companies = raw_data.get("found_companies", [])
        
        for comp in companies:
            edrpou = comp.get("edrpou")
            name = comp.get("name")
            role = comp.get("role")
            
            # Додаємо вузол компанії
            nodes.append({
                "node_id": f"company_{edrpou}",
                "labels": ["Company", "LegalEntity"],
                "properties": {
                    "name": name,
                    "edrpou": edrpou,
                    "status": comp.get("status"),
                    "capital": comp.get("capital")
                }
            })
            
            # Додаємо зв'язок (edge створюватиметься з боку агрегатора, 
            # але ми повертаємо тип зв'язку і цільовий вузол)
            rel_type = "FOUNDER" if role == "founder" else "BENEFICIARY"
            edges.append({
                "target": f"company_{edrpou}",
                "type": rel_type,
                "properties": {
                    "share_percent": comp.get("share_percent"),
                    "source": self.source_name
                }
            })
            
            # Дані для JSON-досьє
            dossier_updates["business_assets"].append({
                "name": name,
                "edrpou": edrpou,
                "role": role,
                "share": comp.get("share_percent")
            })
            
        return {
            "nodes": nodes,
            "edges": edges, # target і type (без source, бо source це сама особа, яку обробляє агрегатор)
            "dossier_updates": dossier_updates
        }
