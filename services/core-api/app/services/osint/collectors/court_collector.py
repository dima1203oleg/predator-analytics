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
                    case_data = {
                        "case_number": case.case_number,
                        "court": case.court_name,
                        "category": case.category,
                        "status": case.status,
                        "date": case.date.isoformat() if case.date else None,
                        "plaintiff": case.plaintiff,
                        "defendant": case.defendant,
                        "judge": case.judge,
                        "result": case.result,
                    }
                    records.append(case_data)
                    if case.category and "кримінал" in case.category.lower():
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
