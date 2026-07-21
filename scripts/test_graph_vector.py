import asyncio
import logging
import sys
import os

# Додаємо корінь проекту до PYTHONPATH для запуску
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "services", "core-api"))

from app.services.dossier.person_aggregator import PersonDossierAggregator
from app.services.qdrant_service import qdrant_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

async def test_graph_and_vector():
    """
    Тестування глибокого графа (Neo4j) та векторної індексації (Qdrant).
    """
    print("\n" + "="*50)
    print("🚀 Етап 10: Тестування Graph Intelligence")
    print("="*50 + "\n")
    
    aggregator = PersonDossierAggregator()
    
    identifier = "1234567890" # Тестовий РНОКПП або ID
    
    # 1. Запит профілю (це запустить find_hidden_assets під капотом)
    print(f"Збираємо досьє для особи: {identifier}")
    result = await aggregator.compile_full_profile(identifier)
    
    profile = result.get("profile", {})
    hidden_assets = profile.get("hidden_assets", [])
    
    print("\n✅ Знайдені приховані активи:")
    for asset in hidden_assets:
        print(f"  - Тип: {asset.get('type')}")
        print(f"    Ланцюжок: {asset.get('chain')}")
        print(f"    Зв'язки: {asset.get('relations')}")
    
    if not hidden_assets:
         print("  (Прихованих активів не знайдено - граф може бути порожнім локально)")
    
    print("\n" + "="*50)
    print("🚀 Етап 11: Тестування Vector Indexing (Qdrant)")
    print("="*50 + "\n")
    
    # Ініціалізація колекції
    await qdrant_service.initialize()
    
    # Індексація профілю
    print("Індексуємо досьє в Qdrant...")
    success = await qdrant_service.index_person_dossier(identifier, profile)
    print(f"Результат індексації: {'УСПІШНО' if success else 'ПОМИЛКА'}")
    
    if success:
        # Семантичний пошук
        query = "бенефіціар офшорів з квартирою в Києві"
        print(f"\nВиконуємо семантичний пошук за запитом: '{query}'")
        search_results = await qdrant_service.semantic_search(query)
        
        print("\n✅ Результати пошуку:")
        for res in search_results:
            print(f"  - ID: {res.get('person_id')}")
            print(f"    Ім'я: {res.get('name')}")
            print(f"    Score: {res.get('score'):.4f}")
            print(f"    Контекст: {res.get('matched_context')[:100]}...\n")

if __name__ == "__main__":
    asyncio.run(test_graph_and_vector())
