"""Corporate Web Collector — Міжнародні корпоративні реєстри.

Джерела: OpenCorporates, ICIJ Offshore Leaks, Companies House.
Класифікація: GREY.
"""
import httpx

from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class CorporateWebCollector(BaseCollector):
    name = "corporate_web"
    display_name = "Міжнародні Корпоративні Реєстри"
    classification = Classification.GREY
    description = "OpenCorporates, ICIJ Offshore Leaks, Panama/Pandora Papers"
    supported_entities = [EntityType.COMPANY, EntityType.PERSON]

    OPENCORPORATES_API = "https://api.opencorporates.com/v0.4"
    ICIJ_API = "https://offshoreleaks.icij.org/search"

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        fragments: list[DataFragment] = []
        search_name = query.name or query.identifier

        # 1. OpenCorporates (безкоштовний тир)
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    f"{self.OPENCORPORATES_API}/companies/search",
                    params={"q": search_name, "per_page": 10},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results", {}).get("companies", [])
                    if results:
                        records = []
                        links = []
                        for r in results:
                            c = r.get("company", {})
                            records.append({
                                "name": c.get("name"),
                                "jurisdiction": c.get("jurisdiction_code"),
                                "company_number": c.get("company_number"),
                                "status": c.get("current_status"),
                                "incorporation_date": c.get("incorporation_date"),
                                "registered_address": c.get("registered_address_in_full"),
                                "opencorporates_url": c.get("opencorporates_url"),
                            })
                            if c.get("jurisdiction_code") in ("cy", "bz", "vg", "pa", "ky", "bm", "sc"):
                                links.append({
                                    "source_id": query.identifier,
                                    "target_id": c.get("company_number", c.get("name")),
                                    "target_name": f"{c.get('name')} ({c.get('jurisdiction_code', '').upper()})",
                                    "relation_type": "OFFSHORE_LINK",
                                    "risk": "HIGH",
                                })

                        fragments.append(DataFragment(
                            category="international_companies",
                            source_name="OpenCorporates",
                            classification=Classification.GREY,
                            data={"total_found": len(results)},
                            raw_records=records,
                            discovered_links=links,
                            confidence=0.8,
                        ))
        except Exception as e:
            self._logger.warning(f"OpenCorporates API помилка: {e}")

        # 2. ICIJ Offshore Leaks (mock — API потребує авторизації)
        mock_offshore = {
            "query": search_name,
            "panama_papers": [],
            "pandora_papers": [],
            "paradise_papers": [],
            "note": "Для реального пошуку відвідайте https://offshoreleaks.icij.org/search?q=" + search_name.replace(" ", "+"),
        }
        fragments.append(DataFragment(
            category="offshore_leaks",
            source_name="ICIJ Offshore Leaks DB",
            classification=Classification.GREY,
            data=mock_offshore,
            confidence=0.3,
            metadata={"note": "Mock. ICIJ не має публічного API."},
        ))

        return fragments
