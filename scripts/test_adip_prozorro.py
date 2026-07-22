import asyncio
import logging
import sys
import os

# Додаємо корінь проекту до PYTHONPATH для запуску
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "services", "core-api"))

from app.services.adip.adip_core import adip_core
from app.services.adip.registry_catalog import catalog_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

async def test_prozorro_integration():
    """
    Демонстрація повного життєвого циклу автономної інтеграції
    на прикладі ProZorro.
    """
    prozorro_url = "https://public.api.openprocurement.org/api/2.5/tenders"
    
    print("\n" + "="*50)
    print("🚀 ADIP: Початок інтеграції еталонного джерела ProZorro")
    print("="*50 + "\n")
    
    result = await adip_core.process_new_source(prozorro_url)
    
    print("\n" + "="*50)
    print("✅ Результат інтеграції:")
    print(f"Тип джерела: {result['source_type']}")
    print(f"Конектор створено: {result['connector_created']}")
    print("="*50 + "\n")
    
    print("Перевірка записів у Registry Catalog:")
    print(catalog_db.registry.keys())

if __name__ == "__main__":
    asyncio.run(test_prozorro_integration())
