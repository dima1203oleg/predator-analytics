"""EDR Collector — Єдиний Державний Реєстр юридичних осіб та ФОП.

Джерело: UkraineRegistriesService (обгортка над API ЄДР).
Класифікація: WHITE.
"""
from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class EdrCollector(BaseCollector):
    """Збирач даних з Єдиного Державного Реєстру."""

    name = "edr"
    display_name = "ЄДР (Єдиний Державний Реєстр)"
    classification = Classification.WHITE
    description = "Дані про юридичних осіб, ФОП, засновників, бенефіціарів, КВЕД"
    supported_entities = [EntityType.COMPANY, EntityType.PERSON]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        """Збір даних з ЄДР."""
        from app.services.ukraine_registries import UkraineRegistriesService

        fragments: list[DataFragment] = []
        service = UkraineRegistriesService()

        try:
            if query.entity_type == EntityType.COMPANY and query.edrpou:
                company = await service.get_company(query.edrpou)
                if company:
                    links = []
                    founders_data = []
                    for f in company.founders:
                        founders_data.append({
                            "name": f.name, "type": f.type, "share": f.share,
                            "edrpou": f.edrpou, "rnokpp": f.rnokpp, "country": f.country,
                        })
                        links.append({
                            "source_id": query.edrpou,
                            "target_id": f.edrpou or f.rnokpp or f.name,
                            "target_name": f.name,
                            "relation_type": "FOUNDER",
                            "risk": "HIGH" if f.country and f.country not in ("Україна", "UA") else "LOW",
                        })

                    managers_data = []
                    for m in company.managers:
                        managers_data.append({
                            "name": m.name, "position": m.position,
                            "appointment_date": m.appointment_date.isoformat() if m.appointment_date else None,
                        })
                        links.append({
                            "source_id": query.edrpou,
                            "target_id": m.name,
                            "target_name": m.name,
                            "relation_type": "MANAGER",
                            "risk": "LOW",
                        })

                    beneficiaries_data = []
                    for b in company.beneficiaries:
                        beneficiaries_data.append({
                            "name": b.name, "ownership_percentage": b.ownership_percentage,
                            "country": b.country,
                        })
                        links.append({
                            "source_id": query.edrpou,
                            "target_id": b.name,
                            "target_name": b.name,
                            "relation_type": "BENEFICIARY",
                            "risk": "HIGH" if b.country and b.country not in ("Україна", "UA") else "MEDIUM",
                        })

                    fragments.append(DataFragment(
                        category="edr",
                        source_name="Єдиний Державний Реєстр",
                        classification=Classification.WHITE,
                        data={
                            "edrpou": company.edrpou,
                            "name": company.name,
                            "short_name": company.short_name,
                            "status": company.status.value if company.status else None,
                            "registration_date": company.registration_date.isoformat() if company.registration_date else None,
                            "address": company.address.full if company.address else None,
                            "kved_primary": company.kved_primary,
                            "kved_primary_name": company.kved_primary_name,
                            "authorized_capital": company.authorized_capital,
                            "phone": company.phone,
                            "email": company.email,
                            "founders": founders_data,
                            "managers": managers_data,
                            "beneficiaries": beneficiaries_data,
                        },
                        discovered_links=links,
                    ))

            elif query.entity_type == EntityType.PERSON and query.name:
                # Пошук ФОП за ПІБ
                companies, total = await service.search_companies(name=query.name, limit=10)
                if companies:
                    records = []
                    for c in companies:
                        records.append({
                            "edrpou": c.edrpou, "name": c.name,
                            "status": c.status.value if c.status else None,
                        })
                    fragments.append(DataFragment(
                        category="edr_related_companies",
                        source_name="ЄДР — Пов'язані компанії",
                        classification=Classification.WHITE,
                        data={"total_found": total, "query_name": query.name},
                        raw_records=records,
                    ))
        finally:
            await service.close()

        return fragments
