"""Sanctions Collector — Мультисписковий скринінг санкцій.

Джерела: РНБО, OFAC SDN, EU Consolidated, UK OFSI, UN, OpenSanctions.
Класифікація: WHITE.
"""
import os

import httpx

from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class SanctionsCollector(BaseCollector):
    """Збирач санкційних даних з національних та міжнародних списків."""

    name = "sanctions"
    display_name = "Санкційні Списки (РНБО/OFAC/EU/UK/UN)"
    classification = Classification.WHITE
    description = "Перевірка у санкційних списках РНБО, OFAC SDN, EU, UK OFSI, UN та OpenSanctions"
    supported_entities = [EntityType.PERSON, EntityType.COMPANY]

    OPENSANCTIONS_API = "https://api.opensanctions.org/match/default"

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        """Збір санкційних збігів."""
        fragments: list[DataFragment] = []
        search_name = query.name or query.identifier

        # 1. Перевірка через UkraineRegistriesService (РНБО)
        try:
            from app.services.ukraine_registries import UkraineRegistriesService
            service = UkraineRegistriesService()
            try:
                result = await service.check_sanctions(
                    name=search_name, edrpou=query.edrpou, rnokpp=query.rnokpp
                )
                if result.is_sanctioned:
                    matches = []
                    links = []
                    for m in result.matches:
                        matches.append({
                            "name": m.name,
                            "list_name": m.list_name,
                            "date_added": m.date_added.isoformat() if m.date_added else None,
                            "reason": m.reason,
                        })
                        links.append({
                            "source_id": query.identifier,
                            "target_id": f"sanctions_{m.list_name}",
                            "target_name": m.list_name,
                            "relation_type": "SANCTIONED_BY",
                            "risk": "HIGH",
                        })

                    fragments.append(DataFragment(
                        category="sanctions",
                        source_name="РНБО України",
                        classification=Classification.WHITE,
                        data={
                            "is_sanctioned": True,
                            "matches_count": len(matches),
                            "checked_lists": result.checked_lists,
                        },
                        raw_records=matches,
                        discovered_links=links,
                        confidence=1.0,
                    ))
                else:
                    fragments.append(DataFragment(
                        category="sanctions",
                        source_name="РНБО України",
                        classification=Classification.WHITE,
                        data={"is_sanctioned": False, "checked_lists": result.checked_lists},
                        confidence=1.0,
                    ))
            finally:
                await service.close()
        except Exception as e:
            self._logger.warning(f"РНБО перевірка не вдалася: {e}")

        # 2. OpenSanctions API (безкоштовний / community)
        try:
            api_key = os.getenv("OPENSANCTIONS_API_KEY", "")
            schema = "Person" if query.entity_type == EntityType.PERSON else "Company"
            payload = {
                "queries": {
                    "q1": {
                        "schema": schema,
                        "properties": {"name": [search_name]},
                    }
                }
            }
            headers = {"Content-Type": "application/json"}
            if api_key:
                headers["Authorization"] = f"ApiKey {api_key}"

            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(self.OPENSANCTIONS_API, json=payload, headers=headers)

                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("responses", {}).get("q1", {}).get("results", [])
                    if results:
                        matches = []
                        for r in results[:10]:
                            props = r.get("properties", {})
                            matches.append({
                                "name": ", ".join(props.get("name", [])),
                                "datasets": r.get("datasets", []),
                                "score": r.get("score", 0),
                                "countries": props.get("country", []),
                                "topics": props.get("topics", []),
                            })

                        fragments.append(DataFragment(
                            category="sanctions_international",
                            source_name="OpenSanctions (OFAC/EU/UK/UN)",
                            classification=Classification.WHITE,
                            data={
                                "total_matches": len(results),
                                "top_score": results[0].get("score", 0) if results else 0,
                            },
                            raw_records=matches,
                            confidence=0.9,
                        ))
        except Exception as e:
            self._logger.warning(f"OpenSanctions API недоступний: {e}")

        # 3. Перевірка через GlobalSanctionsService
        try:
            from app.services.osint.global_sanctions import GlobalSanctionsService
            global_svc = GlobalSanctionsService()
            entity_type = "person" if query.entity_type == EntityType.PERSON else "organization"
            global_result = await global_svc.check_entity(search_name, entity_type)

            if global_result.get("matches"):
                global_matches = []
                for m in global_result["matches"]:
                    global_matches.append({
                        "list": m.get("list"),
                        "reason": m.get("reason"),
                        "confidence": m.get("confidence"),
                    })
                fragments.append(DataFragment(
                    category="sanctions_global",
                    source_name="Global Sanctions Service",
                    classification=Classification.WHITE,
                    data={"matches_count": len(global_matches)},
                    raw_records=global_matches,
                    confidence=0.85,
                ))
        except Exception as e:
            self._logger.warning(f"GlobalSanctions перевірка не вдалася: {e}")

        return fragments
