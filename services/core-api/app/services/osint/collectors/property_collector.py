"""Property Collector — Реєстр речових прав на нерухоме майно.

Класифікація: WHITE.
"""
from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class PropertyCollector(BaseCollector):
    name = "property"
    display_name = "Реєстр Нерухомості"
    classification = Classification.WHITE
    description = "Об'єкти нерухомості, земельні ділянки, обтяження, іпотеки"
    supported_entities = [EntityType.PERSON, EntityType.COMPANY, EntityType.PROPERTY]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        from app.services.ukraine_registries import UkraineRegistriesService
        fragments: list[DataFragment] = []
        service = UkraineRegistriesService()
        try:
            properties = await service.search_real_estate(
                owner_name=query.name,
                owner_edrpou=query.edrpou,
                owner_rnokpp=query.rnokpp,
                address=query.address,
                limit=100,
            )
            if properties:
                records = []
                links = []
                for p in properties:
                    records.append({
                        "cadastral_number": p.cadastral_number,
                        "address": p.address,
                        "type": p.type,
                        "area_sqm": p.area_sqm,
                        "owner_name": p.owner_name,
                        "registration_date": p.registration_date.isoformat() if p.registration_date else None,
                    })
                    links.append({
                        "source_id": query.identifier,
                        "target_id": p.cadastral_number or p.address,
                        "target_name": f"{p.type}: {p.address}",
                        "relation_type": "OWNS_PROPERTY",
                        "risk": "LOW",
                    })

                fragments.append(DataFragment(
                    category="property",
                    source_name="Державний реєстр речових прав",
                    classification=Classification.WHITE,
                    data={"total_objects": len(properties)},
                    raw_records=records,
                    discovered_links=links,
                ))
        finally:
            await service.close()
        return fragments
