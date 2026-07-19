import asyncio
from app.services.osint.dossier_aggregator import DossierAggregator
from app.services.osint.collectors.base import DossierQuery, EntityType, Classification
import json

async def test_aggregator():
    aggregator = DossierAggregator()
    query = DossierQuery(
        entity_type=EntityType.PERSON,
        identifier="Кізима Дмитро Миколайович",
        name="Кізима Дмитро Миколайович",
        classification_levels=[Classification.WHITE, Classification.GREY, Classification.BLACK]
    )
    dossier = await aggregator.compile_dossier(query)
    print(dossier.model_dump_json(indent=2))

if __name__ == "__main__":
    asyncio.run(test_aggregator())
