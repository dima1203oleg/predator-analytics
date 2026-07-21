import asyncio
import logging
from typing import Any

from app.services.osint.collectors.base import BaseOsintCollector

logger = logging.getLogger(__name__)

class EdrCollector(BaseOsintCollector):
    """Колектор Єдиного державного реєстру (ЄДР).
    Шукає компанії, засновників, бенефіціарів за ПІБ або РНОКПП особи.
    Симулює звернення до зовнішнього API (YouControl / Opendatabot / Дія).
    Адаптовано до онтології FollowTheMoney (Company, Ownership, Directorship).
    """

    def __init__(self):
        super().__init__(source_name="EDR_Registry")

    async def collect(self, query: str, **kwargs) -> dict[str, Any]:
        """Симуляція запиту до ЄДР"""
        logger.info(f"[EdrCollector] Пошук активів у ЄДР для: {query}")
        await asyncio.sleep(0.5) # Імітація мережевої затримки

        # Моковий відповідач
        if "іванов" in query.lower() or "ivanov" in query.lower() or "test" in query.lower():
            return {
                "search_query": query,
                "found_companies": [
                    {
                        "registrationNumber": "12345678",
                        "name": "ТОВ 'Рога і Копита'",
                        "status": "active",
                        "jurisdiction": "UA",
                        "incorporationDate": "2015-05-20",
                        "role": "founder", # maps to Ownership
                        "share_percent": 100,
                        "capital": 50000
                    },
                    {
                        "registrationNumber": "87654321",
                        "name": "ПРАТ 'БудІнвест'",
                        "status": "bankrupt",
                        "jurisdiction": "UA",
                        "incorporationDate": "2008-11-12",
                        "role": "beneficiary", # maps to Ownership (UBO)
                        "share_percent": 25,
                        "capital": 1000000
                    },
                    {
                        "registrationNumber": "99999999",
                        "name": "ГО 'Антикорупційний Щит'",
                        "status": "active",
                        "jurisdiction": "UA",
                        "incorporationDate": "2019-01-01",
                        "role": "director", # maps to Directorship
                        "share_percent": 0,
                        "capital": 0
                    }
                ]
            }

        return {"search_query": query, "found_companies": []}

    def normalize(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Конвертує сиру відповідь ЄДР у формат графових вузлів (Nodes)
        та зв'язків (Edges) для інтеграції з Neo4j, спираючись на FtM.
        """
        nodes = []
        edges = []
        dossier_updates = {"business_assets": []}

        companies = raw_data.get("found_companies", [])

        for comp in companies:
            reg_num = comp.get("registrationNumber")
            name = comp.get("name")
            role = comp.get("role")

            company_id = f"company_{reg_num}"

            # Node: Company (FtM schema)
            nodes.append({
                "node_id": company_id,
                "labels": ["Company", "LegalEntity"],
                "properties": {
                    "name": name,
                    "registrationNumber": reg_num,
                    "status": comp.get("status"),
                    "jurisdiction": comp.get("jurisdiction"),
                    "incorporationDate": comp.get("incorporationDate"),
                    "capital": comp.get("capital")
                }
            })

            # Edge mappings based on FtM logic (Neo4j edges represent FtM entities like Ownership/Directorship)
            if role in ["founder", "beneficiary"]:
                rel_type = "OWNS"
                edges.append({
                    "target": company_id,
                    "type": rel_type,
                    "properties": {
                        "share_percent": comp.get("share_percent"),
                        "role": role,
                        "source": self.source_name
                    }
                })
            elif role in ["director", "manager"]:
                rel_type = "DIRECTS"
                edges.append({
                    "target": company_id,
                    "type": rel_type,
                    "properties": {
                        "role": role,
                        "source": self.source_name
                    }
                })
            else:
                rel_type = "ASSOCIATED_WITH"
                edges.append({
                    "target": company_id,
                    "type": rel_type,
                    "properties": {
                        "role": role,
                        "source": self.source_name
                    }
                })

            # Дані для JSON-досьє
            dossier_updates["business_assets"].append({
                "name": name,
                "edrpou": reg_num, # legacy key for aggregator compatibility
                "role": role,
                "share": comp.get("share_percent")
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "dossier_updates": dossier_updates
        }
