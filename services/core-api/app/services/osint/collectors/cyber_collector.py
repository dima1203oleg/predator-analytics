"""Cyber Collector — Збір інфраструктурних слідів об'єкта.

Джерела: Shodan, Censys, DNS Dumpster.
Класифікація: CYBER/GREY.
"""
import os
import httpx

from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class CyberCollector(BaseCollector):
    name = "cyber"
    display_name = "Cyber Infrastructure Monitor"
    classification = Classification.GREY
    description = "Збір даних про IP, домени, порти та сервіси об'єкта (Shodan, Censys)"
    supported_entities = [EntityType.COMPANY, EntityType.PERSON]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        fragments: list[DataFragment] = []
        search_term = query.name or query.identifier
        if not search_term:
            return fragments

        shodan_api_key = os.getenv("SHODAN_API_KEY")
        
        # 1. Shodan Lookup
        if shodan_api_key:
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.get(
                        "https://api.shodan.io/shodan/host/search",
                        params={"key": shodan_api_key, "query": search_term}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        matches = data.get("matches", [])
                        if matches:
                            fragments.append(DataFragment(
                                category="cyber",
                                source_name="Shodan",
                                classification=Classification.GREY,
                                data={"total": data.get("total"), "top_match": matches[0]},
                                confidence=0.85
                            ))
            except Exception as e:
                self._logger.error(f"Shodan search failed: {e}")
        else:
            # Fallback/Mock if no API key
            fragments.append(DataFragment(
                category="cyber",
                source_name="Shodan (Mock)",
                classification=Classification.GREY,
                data={
                    "total": 3,
                    "top_match": {
                        "ip_str": "194.177.1.240",
                        "port": 3030,
                        "org": "Predator Analytics Node",
                        "os": "Linux"
                    }
                },
                confidence=0.7
            ))

        return fragments
