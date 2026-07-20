"""Interpol Collector — Перевірка у базах Інтерполу.

Джерело: Interpol Red/Yellow Notices API (публічний).
Класифікація: BLACK.
"""
import httpx

from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class InterpolCollector(BaseCollector):
    name = "interpol"
    display_name = "Інтерпол (Red/Yellow Notices)"
    classification = Classification.BLACK
    description = "Перевірка у базі міжнародного розшуку Інтерполу"
    supported_entities = [EntityType.PERSON]

    INTERPOL_API = "https://ws-public.interpol.int/notices/v1"

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        fragments: list[DataFragment] = []
        name = query.name or query.identifier

        # Розділяємо ім'я на компоненти
        name_parts = name.split()
        forename = name_parts[0] if name_parts else ""
        surname = name_parts[-1] if len(name_parts) > 1 else name_parts[0]

        # Red Notices — розшук за вбивства, тероризм, організована злочинність
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    f"{self.INTERPOL_API}/red",
                    params={
                        "forename": forename,
                        "name": surname,
                        "resultPerPage": 10,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    notices = data.get("_embedded", {}).get("notices", [])
                    if notices:
                        records = []
                        links = []
                        for n in notices:
                            records.append({
                                "entity_id": n.get("entity_id"),
                                "forename": n.get("forename"),
                                "name": n.get("name"),
                                "date_of_birth": n.get("date_of_birth"),
                                "nationalities": n.get("nationalities", []),
                                "country_of_birth_id": n.get("country_of_birth_id"),
                                "charge": n.get("charge"),
                                "url": n.get("_links", {}).get("self", {}).get("href"),
                            })
                            links.append({
                                "source_id": query.identifier,
                                "target_id": f"interpol_red_{n.get('entity_id', 'unknown')}",
                                "target_name": "🔴 Інтерпол Red Notice",
                                "relation_type": "INTERPOL_RED_NOTICE",
                                "risk": "HIGH",
                            })

                        fragments.append(DataFragment(
                            category="interpol_red",
                            source_name="Інтерпол — Red Notices",
                            classification=Classification.BLACK,
                            data={"total_matches": len(notices), "type": "RED"},
                            raw_records=records,
                            discovered_links=links,
                            confidence=0.7,
                        ))
                    else:
                        fragments.append(DataFragment(
                            category="interpol_red",
                            source_name="Інтерпол — Red Notices",
                            classification=Classification.BLACK,
                            data={"total_matches": 0, "status": "clean"},
                            confidence=0.9,
                        ))

                # Yellow Notices — розшук зниклих безвісти
                resp2 = await client.get(
                    f"{self.INTERPOL_API}/yellow",
                    params={"forename": forename, "name": surname, "resultPerPage": 5},
                )
                if resp2.status_code == 200:
                    data2 = resp2.json()
                    notices2 = data2.get("_embedded", {}).get("notices", [])
                    if notices2:
                        records2 = []
                        for n in notices2:
                            records2.append({
                                "entity_id": n.get("entity_id"),
                                "forename": n.get("forename"),
                                "name": n.get("name"),
                                "nationalities": n.get("nationalities", []),
                            })
                        fragments.append(DataFragment(
                            category="interpol_yellow",
                            source_name="Інтерпол — Yellow Notices",
                            classification=Classification.BLACK,
                            data={"total_matches": len(notices2), "type": "YELLOW"},
                            raw_records=records2,
                            confidence=0.7,
                        ))
        except Exception as e:
            self._logger.warning(f"Interpol API помилка: {e}")

        return fragments
