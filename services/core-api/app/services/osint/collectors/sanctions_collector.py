from typing import Dict, Any, List
from app.services.osint.collectors.base import BaseOsintCollector
import asyncio

class SanctionsCollector(BaseOsintCollector):
    """
    Колектор санкційних списків (РНБО, OFAC, EU).
    Симулює перевірку особи та пов'язаних з нею компаній 
    на наявність у санкційних списках.
    """

    def __init__(self):
        super().__init__(source_name="Sanctions_DB")

    async def collect(self, query: str, **kwargs) -> Dict[str, Any]:
        """Симуляція запиту до баз санкцій"""
        await asyncio.sleep(0.4)
        
        # Симулюємо санкції для "санкційних" ключових слів або специфічних прізвищ
        if "іванов" in query.lower() or "sanction" in query.lower() or "офшор" in query.lower():
            return {
                "search_query": query,
                "sanctions": [
                    {
                        "list_name": "РНБО України",
                        "date_added": "2022-10-19",
                        "reason": "Загроза національній безпеці",
                        "entity_type": "physical_person"
                    }
                ]
            }
            
        return {"search_query": query, "sanctions": []}

    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        nodes = []
        edges = []
        dossier_updates = {"legal_status": {"sanctions": []}}
        
        sanctions = raw_data.get("sanctions", [])
        
        for sanction in sanctions:
            list_name = sanction.get("list_name")
            
            node_id = f"sanction_{hash(list_name) % 100000}"
            
            nodes.append({
                "node_id": node_id,
                "labels": ["SanctionedEntity"],
                "properties": {
                    "list_name": list_name,
                    "date_added": sanction.get("date_added"),
                    "reason": sanction.get("reason")
                }
            })
            
            edges.append({
                "target": node_id,
                "type": "HAS_SANCTION",
                "properties": {
                    "source": self.source_name
                }
            })
            
            dossier_updates["legal_status"]["sanctions"].append({
                "list_name": list_name,
                "date": sanction.get("date_added"),
                "reason": sanction.get("reason")
            })
            
        return {
            "nodes": nodes,
            "edges": edges,
            "dossier_updates": dossier_updates
        }
