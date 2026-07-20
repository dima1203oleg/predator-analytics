"""PEP Collector — Публічно Значущі Особи та Е-Декларації.

Джерела: НАЗК реєстр, declarations.com.ua, OpenSanctions PEP dataset.
Класифікація: WHITE.
"""
import os

import httpx

from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class PepCollector(BaseCollector):
    name = "pep"
    display_name = "PEP / Е-Декларації (НАЗК)"
    classification = Classification.WHITE
    description = "Перевірка на статус Публічно Значущої Особи, доходи, майно"
    supported_entities = [EntityType.PERSON]

    DECLARATIONS_API = "https://declarations.com.ua/api"

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        fragments: list[DataFragment] = []
        search_name = query.name or query.identifier

        # 1. OpenSanctions PEP check
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                api_key = os.getenv("OPENSANCTIONS_API_KEY", "")
                headers = {"Content-Type": "application/json"}
                if api_key:
                    headers["Authorization"] = f"ApiKey {api_key}"

                resp = await client.post(
                    "https://api.opensanctions.org/match/peps",
                    json={"queries": {"q1": {"schema": "Person", "properties": {"name": [search_name]}}}},
                    headers=headers,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("responses", {}).get("q1", {}).get("results", [])
                    if results:
                        pep_records = []
                        for r in results[:5]:
                            props = r.get("properties", {})
                            pep_records.append({
                                "name": ", ".join(props.get("name", [])),
                                "position": ", ".join(props.get("position", [])),
                                "country": ", ".join(props.get("country", [])),
                                "score": r.get("score", 0),
                                "datasets": r.get("datasets", []),
                            })
                        fragments.append(DataFragment(
                            category="pep",
                            source_name="OpenSanctions PEP",
                            classification=Classification.WHITE,
                            data={"is_pep": True, "matches": len(results)},
                            raw_records=pep_records,
                            confidence=0.85,
                        ))
                    else:
                        fragments.append(DataFragment(
                            category="pep",
                            source_name="OpenSanctions PEP",
                            classification=Classification.WHITE,
                            data={"is_pep": False},
                            confidence=0.85,
                        ))
        except Exception as e:
            self._logger.warning(f"PEP check failed: {e}")

        # 2. E-Declarations (declarations.com.ua) — публічний API
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{self.DECLARATIONS_API}/search",
                    params={"q": search_name, "format": "json"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    declarations = data.get("results", [])
                    if declarations:
                        records = []
                        for d in declarations[:10]:
                            records.append({
                                "declarant": d.get("general", {}).get("full_name"),
                                "position": d.get("general", {}).get("post", {}).get("post"),
                                "year": d.get("intro", {}).get("declaration_year"),
                                "type": d.get("intro", {}).get("doc_type"),
                                "url": d.get("url"),
                            })
                        fragments.append(DataFragment(
                            category="declarations",
                            source_name="Е-Декларації (НАЗК)",
                            classification=Classification.WHITE,
                            data={"total_declarations": len(declarations)},
                            raw_records=records,
                            confidence=0.9,
                        ))
        except Exception as e:
            self._logger.warning(f"E-Declarations API failed: {e}")

        return fragments
