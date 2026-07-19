import asyncio
from app.services.osint.dossier_aggregator import DossierAggregator
from app.services.osint.collectors.base import DossierQuery, EntityType

async def main():
    aggregator = DossierAggregator()
    query = DossierQuery(
        entity_type=EntityType.PERSON,
        identifier="Кізима Дмитро Миколайович",
        name="Кізима Дмитро Миколайович",
        date_of_birth="1985-03-12"
    )
    result = await aggregator.compile_dossier(query=query)
    import json
    print(json.dumps(result.model_dump(), indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())
