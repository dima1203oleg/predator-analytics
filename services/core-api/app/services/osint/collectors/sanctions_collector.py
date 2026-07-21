import asyncio
import logging
from typing import Any

from app.services.osint.collectors.base import BaseOsintCollector

logger = logging.getLogger(__name__)

class SanctionsCollector(BaseOsintCollector):
    """Колектор санкційних списків (РНБО, OFAC, EU).
    Симулює перевірку особи та пов'язаних з нею компаній
    на наявність у санкційних списках.
    Підтримує мапінг до онтології FollowTheMoney (FtM).
    """

    def __init__(self):
        super().__init__(source_name="Sanctions_DB")

    async def collect(self, query: str, **kwargs) -> dict[str, Any]:
        """Симуляція запиту до баз санкцій (напр., OpenSanctions API)"""
        logger.info(f"[SanctionsCollector] Пошук по санкційних списках для: {query}")
        await asyncio.sleep(0.4)

        # Симулюємо санкції для "санкційних" ключових слів або специфічних прізвищ
        if "іванов" in query.lower() or "sanction" in query.lower() or "офшор" in query.lower() or "test" in query.lower():
            return {
                "search_query": query,
                "sanctions": [
                    {
                        "list_name": "РНБО України",
                        "authority": "National Security and Defense Council of Ukraine",
                        "date_added": "2022-10-19",
                        "reason": "Загроза національній безпеці",
                        "entity_type": "Person", # FollowTheMoney schema
                        "target_name": "Іванов Іван Іванович",
                        "program": "UKR-SANCTIONS-2022"
                    },
                    {
                        "list_name": "OFAC SDN",
                        "authority": "Office of Foreign Assets Control",
                        "date_added": "2023-01-15",
                        "reason": "Cybercrime activities",
                        "entity_type": "Company", # FollowTheMoney schema
                        "target_name": "ТОВ ОФШОР",
                        "program": "CYBER2"
                    }
                ]
            }

        return {"search_query": query, "sanctions": []}

    def normalize(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        nodes = []
        edges = []
        dossier_updates = {"legal_status": {"sanctions": []}}

        sanctions = raw_data.get("sanctions", [])

        for sanction in sanctions:
            list_name = sanction.get("list_name")
            target_name = sanction.get("target_name")
            entity_type = sanction.get("entity_type") # "Person" or "Company"

            # Node: The Target Entity (FtM: Person or Company)
            target_id = f"{entity_type.lower()}_{hash(target_name) % 100000}"
            nodes.append({
                "node_id": target_id,
                "labels": [entity_type, "LegalEntity"],
                "properties": {
                    "name": target_name
                }
            })

            # Node: The Sanction Event (FtM: Sanction)
            sanction_id = f"sanction_{hash(list_name + target_name) % 100000}"
            nodes.append({
                "node_id": sanction_id,
                "labels": ["Sanction", "FtM_Sanction"],
                "properties": {
                    "authority": sanction.get("authority"),
                    "program": sanction.get("program"),
                    "startDate": sanction.get("date_added"),
                    "reason": sanction.get("reason"),
                    "list_name": list_name
                }
            })

            # Edge: Sanction applies to Target (FtM: entity -> Person/Company)
            edges.append({
                "source": sanction_id,
                "target": target_id,
                "type": "APPLIES_TO",
                "properties": {
                    "source": self.source_name
                }
            })

            # If this is the main query target, link them directly
            edges.append({
                "target": target_id,
                "type": "IDENTIFIED_AS",
                "properties": {
                    "source": self.source_name
                }
            })

            dossier_updates["legal_status"]["sanctions"].append({
                "list_name": list_name,
                "authority": sanction.get("authority"),
                "target": target_name,
                "date": sanction.get("date_added"),
                "reason": sanction.get("reason")
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "dossier_updates": dossier_updates
        }
