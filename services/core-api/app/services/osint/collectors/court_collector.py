"""Court Collector — Єдиний державний реєстр судових рішень.

Джерело: reyestr.court.gov.ua (публічний API).
Класифікація: WHITE.
"""
from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class CourtCollector(BaseCollector):
    """Збирач судових справ з Реєстру судових рішень."""

    name = "court"
    display_name = "Реєстр Судових Рішень"
    classification = Classification.WHITE
    description = "Судові справи: кримінальні, цивільні, господарські, адміністративні"
    supported_entities = [EntityType.PERSON, EntityType.COMPANY]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        """Збір судових справ за ПІБ або ЄДРПОУ."""
        from app.services.ukraine_registries import UkraineRegistriesService

        fragments: list[DataFragment] = []
        service = UkraineRegistriesService()

        try:
            search_name = query.name or query.identifier
            cases, total = await service.search_court_cases(
                party_name=search_name,
                party_edrpou=query.edrpou,
                limit=50,
            )

            if cases:
                records = []
                criminal_count = 0
                for case in cases:
                    category_str = case.type.value if hasattr(case.type, "value") else str(case.type)
                    case_data = {
                        "case_number": case.case_number,
                        "court": getattr(case, "court", ""),
                        "category": category_str,
                        "status": case.status,
                        "date": case.date.isoformat() if case.date else None,
                        "parties": [{"name": p.name, "role": p.role, "type": getattr(p, "party_type", "")} for p in getattr(case, "parties", [])],
                        "subject": getattr(case, "subject", ""),
                    }
                    records.append(case_data)
                    if "кримінал" in category_str.lower():
                        criminal_count += 1

                fragments.append(DataFragment(
                    category="court_cases",
                    source_name="Єдиний Реєстр Судових Рішень",
                    classification=Classification.WHITE,
                    data={
                        "total_cases": total,
                        "criminal_cases": criminal_count,
                        "civil_cases": total - criminal_count,
                        "query_name": search_name,
                    },
                    raw_records=records,
                    confidence=0.95,
                ))
        except Exception as e:
            # Якщо API недоступний — повертаємо mock
            self._logger.warning(f"Court API недоступний, використовую mock: {e}")
            fragments.append(DataFragment(
                category="court_cases",
                source_name="Єдиний Реєстр Судових Рішень (mock)",
                classification=Classification.WHITE,
                data={
                    "total_cases": 0,
                    "criminal_cases": 0,
                    "note": "API тимчасово недоступний",
                },
                confidence=0.0,
            ))
        finally:
            await service.close()

        return fragments
