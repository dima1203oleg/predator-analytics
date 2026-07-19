import asyncio
from app.services.osint.dossier_aggregator import DossierAggregator
from app.services.osint.collectors.base import DossierQuery, EntityType, Classification

async def main():
    print("Initializing Aggregator...")
    aggregator = DossierAggregator()
    query = DossierQuery(
        entity_type=EntityType.PERSON,
        identifier="kizyma_d",
        name="Кізима Дмитро Миколайович",
        email="kizyma.d@example.com",
        classification_levels=[Classification.WHITE, Classification.GREY, Classification.BLACK]
    )
    print("Compiling dossier...")
    dossier = await aggregator.compile_dossier(query)
    
    print("\n--- RESULTS ---")
    print(f"Status: {dossier.status}")
    print(f"Risk Score: {dossier.risk_assessment.get('composite_score')}")
    print(f"Risk Level: {dossier.risk_assessment.get('risk_level')}")
    
    for category, section in dossier.sections.items():
        print(f"\n[{category.upper()}] sources: {section['sources']}")
        print(f"Data: {section['data']}")

if __name__ == "__main__":
    asyncio.run(main())
