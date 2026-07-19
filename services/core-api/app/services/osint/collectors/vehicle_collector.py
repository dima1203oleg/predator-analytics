"""Vehicle Collector — Реєстр транспортних засобів МВС.

Класифікація: WHITE.
"""
from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class VehicleCollector(BaseCollector):
    name = "vehicle"
    display_name = "Реєстр Транспортних Засобів"
    classification = Classification.WHITE
    description = "Авто, VIN-декодинг, історія реєстрацій, перевірка на розшук"
    supported_entities = [EntityType.PERSON, EntityType.COMPANY, EntityType.VEHICLE]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        from app.services.ukraine_registries import UkraineRegistriesService
        fragments: list[DataFragment] = []
        service = UkraineRegistriesService()
        try:
            vehicles = await service.search_vehicles(
                owner_name=query.name,
                owner_edrpou=query.edrpou,
                owner_rnokpp=query.rnokpp,
                vin=query.identifier if query.entity_type == EntityType.VEHICLE else None,
                limit=50,
            )
            if vehicles:
                records = []
                links = []
                for v in vehicles:
                    records.append({
                        "vin": v.vin, "plate_number": v.plate_number,
                        "brand": v.brand, "model": v.model, "year": v.year,
                        "color": v.color, "owner_name": v.owner_name,
                        "registration_date": v.registration_date.isoformat() if v.registration_date else None,
                    })
                    links.append({
                        "source_id": query.identifier,
                        "target_id": v.vin or v.plate_number,
                        "target_name": f"{v.brand} {v.model} ({v.plate_number})",
                        "relation_type": "OWNS_VEHICLE",
                        "risk": "LOW",
                    })

                fragments.append(DataFragment(
                    category="vehicles",
                    source_name="Реєстр ТЗ МВС",
                    classification=Classification.WHITE,
                    data={"total_vehicles": len(vehicles)},
                    raw_records=records,
                    discovered_links=links,
                ))
        finally:
            await service.close()
        return fragments
