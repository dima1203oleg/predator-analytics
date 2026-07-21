import asyncio
from typing import Any

from app.services.osint.collectors.base import BaseOsintCollector


class LeakCollector(BaseOsintCollector):
    """Колектор витоків даних (Data Breaches / Darknet).
    Шукає згадки особи, її пошт, телефонів у злитих базах.
    Симулює звернення до HaveIBeenPwned / DeHashed / Leak-OSINT API.
    """

    def __init__(self):
        super().__init__(source_name="LeakDB_Darknet")

    async def collect(self, query: str, **kwargs) -> dict[str, Any]:
        """Симуляція запиту до бази витоків"""
        await asyncio.sleep(0.7)

        # Симулюємо перевірку в Darknet
        is_high_risk = "black" in query.lower() or "hack" in query.lower() or "dark" in query.lower() or "іванов" in query.lower()

        if is_high_risk:
            return {
                "search_query": query,
                "leaks": [
                    {
                        "source": "RaidForums Archive 2021",
                        "date": "2021-05-12",
                        "compromised_data": ["email", "password_hash", "phone"],
                        "email": "ivan.boss@gmail.com",
                        "risk_level": "CRITICAL",
                        "description": "Злита база даних користувачів. Містить хеші паролів."
                    },
                    {
                        "source": "Collection #1",
                        "date": "2019-01-01",
                        "compromised_data": ["email", "password"],
                        "email": "ivan.boss@gmail.com",
                        "risk_level": "HIGH",
                        "description": "Масштабний витік комбінацій email:password."
                    }
                ]
            }

        return {"search_query": query, "leaks": []}

    def normalize(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        nodes = []
        edges = []
        dossier_updates = {"digital_footprint": {"leaks": []}}

        leaks = raw_data.get("leaks", [])

        for idx, leak in enumerate(leaks):
            source = leak.get("source")
            email = leak.get("email")

            node_id = f"leak_{hash(source + email) % 1000000}"

            nodes.append({
                "node_id": node_id,
                "labels": ["DataBreach", "DarknetMention"],
                "properties": {
                    "source": source,
                    "date": leak.get("date"),
                    "risk_level": leak.get("risk_level"),
                    "description": leak.get("description")
                }
            })

            edges.append({
                "target": node_id,
                "type": "COMPROMISED_IN",
                "properties": {
                    "email": email,
                    "data_types": leak.get("compromised_data"),
                    "source": self.source_name
                }
            })

            dossier_updates["digital_footprint"]["leaks"].append({
                "email": email,
                "source": source,
                "date": leak.get("date"),
                "risk": leak.get("risk_level")
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "dossier_updates": dossier_updates
        }
