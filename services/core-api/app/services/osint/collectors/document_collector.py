from typing import Dict, Any, List
from app.services.osint.collectors.base import BaseOsintCollector
import asyncio

class DocumentCollector(BaseOsintCollector):
    """
    Колектор документів (Декларації НАЗК, судові рішення, тощо).
    Парсить текст та витягує зв'язки (напр. задеклароване авто дружини).
    """

    def __init__(self):
        super().__init__(source_name="Document_Registry")

    async def collect(self, query: str, **kwargs) -> Dict[str, Any]:
        """Симуляція пошуку документів"""
        await asyncio.sleep(0.4)
        
        # Симулюємо знайдену декларацію НАЗК
        if "іванов" in query.lower() or "ivanov" in query.lower():
            return {
                "search_query": query,
                "documents": [
                    {
                        "doc_id": "nazk_2023_12345",
                        "type": "declaration",
                        "year": 2023,
                        "assets": {
                            "real_estate": [
                                {"type": "Квартира", "area": 250, "location": "Київ", "owner": "self"}
                            ],
                            "vehicles": [
                                {"brand": "Mercedes-Benz G-Class", "year": 2023, "owner": "spouse"}
                            ]
                        },
                        "relatives": [
                            {"name": "Іванова Марія", "relation": "Дружина", "is_pep": True}
                        ]
                    }
                ]
            }
            
        return {"search_query": query, "documents": []}

    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        nodes = []
        edges = []
        dossier_updates = {
            "property": {"real_estate": [], "vehicles": []},
            "relatives": []
        }
        
        docs = raw_data.get("documents", [])
        
        for doc in docs:
            # Обробка родичів
            for rel in doc.get("relatives", []):
                rel_name = rel.get("name")
                relation = rel.get("relation")
                
                rel_node_id = f"person_{hash(rel_name) % 100000}"
                
                nodes.append({
                    "node_id": rel_node_id,
                    "labels": ["Person", "Relative"],
                    "properties": {
                        "name": rel_name,
                        "is_pep": rel.get("is_pep")
                    }
                })
                
                edges.append({
                    "target": rel_node_id,
                    "type": "RELATED_TO",
                    "properties": {
                        "relation": relation,
                        "source": self.source_name
                    }
                })
                
                dossier_updates["relatives"].append({
                    "name": rel_name,
                    "relation": relation,
                    "is_pep": rel.get("is_pep")
                })
                
            # Обробка нерухомісті
            for estate in doc.get("assets", {}).get("real_estate", []):
                dossier_updates["property"]["real_estate"].append({
                    "type": estate.get("type"),
                    "area": f"{estate.get('area')} м2",
                    "location": estate.get("location")
                })
                
            # Обробка авто
            for vehicle in doc.get("assets", {}).get("vehicles", []):
                dossier_updates["property"]["vehicles"].append({
                    "brand": vehicle.get("brand"),
                    "year": vehicle.get("year")
                })
                
        return {
            "nodes": nodes,
            "edges": edges,
            "dossier_updates": dossier_updates
        }
