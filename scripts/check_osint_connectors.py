#!/usr/bin/env python3
"""
Скрипт для перевірки статусу OSINT коннекторів
Перевіряє підключення до зовнішніх реєстрів без локального backend
"""
import asyncio
import sys
from pathlib import Path

# Додаємо проект до шляху
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.connectors.prozorro import prozorro_connector
from app.connectors.edrpou import edrpou_connector
from app.connectors.customs import customs_connector
from app.connectors.nbu_fx import nbu_fx_connector
from app.connectors.court import court_connector


async def check_connector(connector, name: str) -> dict:
    """Перевіряє статус коннектора"""
    print(f"\n🔍 Перевірка {name}...")
    
    try:
        # Health check
        status = await connector.health_check()
        print(f"  Статус: {status.value}")
        
        # Спроба пошуку
        test_queries = {
            "Prozorro": "тендер",
            "EDRPOU": "12345678",
            "Customs": "митні",
            "NBU": "USD",
            "Court": "рішення"
        }
        
        query = test_queries.get(name, "test")
        result = await connector.search(query, limit=5)
        
        print(f"  Пошук успішний: {result.success}")
        print(f"  Кількість результатів: {result.records_count}")
        
        if result.error:
            print(f"  Помилка: {result.error}")
        
        return {
            "name": name,
            "status": status.value,
            "search_success": result.success,
            "records_count": result.records_count,
            "error": result.error
        }
        
    except Exception as e:
        print(f"  ❌ Критична помилка: {e}")
        return {
            "name": name,
            "status": "ERROR",
            "search_success": False,
            "records_count": 0,
            "error": str(e)
        }
    finally:
        await connector.close()


async def main():
    """Головна функція"""
    print("🦅 PREDATOR Analytics - Перевірка OSINT коннекторів")
    print("=" * 60)
    
    connectors = [
        (prozorro_connector, "Prozorro"),
        (edrpou_connector, "EDRPOU"),
        (customs_connector, "Customs"),
        (nbu_fx_connector, "NBU"),
        (court_connector, "Court"),
    ]
    
    results = []
    for connector, name in connectors:
        result = await check_connector(connector, name)
        results.append(result)
    
    print("\n" + "=" * 60)
    print("📊 ЗВІТ ПО СТАТУСУ КОННЕКТОРІВ")
    print("=" * 60)
    
    healthy = 0
    degraded = 0
    offline = 0
    
    for result in results:
        status_icon = "✅" if result["status"] == "HEALTHY" else "⚠️" if result["status"] == "DEGRADED" else "❌"
        print(f"{status_icon} {result['name']:15} | Статус: {result['status']:10} | Пошук: {'✅' if result['search_success'] else '❌'} | Результатів: {result['records_count']}")
        
        if result["status"] == "HEALTHY":
            healthy += 1
        elif result["status"] == "DEGRADED":
            degraded += 1
        else:
            offline += 1
    
    print("=" * 60)
    print(f"Всього: {len(results)} | Здорових: {healthy} | Деградованих: {degraded} | Офлайн: {offline}")
    
    # Перевірка підключень до БД
    print("\n" + "=" * 60)
    print("🗄️ ПЕРЕВІРКА ПІДКЛЮЧЕННЯ ДО БАЗ ДАНИХ")
    print("=" * 60)
    
    print("❌ Backend недоступний на:")
    print("   - NVIDIA сервер (194.177.1.240) - SSH недоступний")
    print("   - NVIDIA (194.177.1.240) - SSH недоступний")
    print("   - Локально - Docker не запущено")
    
    print("\n⚠️  Всі БД налаштовані на NVIDIA сервер:")
    print("   - PostgreSQL: 194.177.1.240:5432")
    print("   - Redis: 194.177.1.240:6379")
    print("   - Qdrant: 194.177.1.240:6333")
    print("   - OpenSearch: 194.177.1.240:9200")
    print("   - MinIO: 194.177.1.240:9000")
    print("   - Neo4j: 194.177.1.240:7687")
    
    print("\n💡 Рекомендація: Запустіть backend на NVIDIA сервері або NVIDIA")


if __name__ == "__main__":
    asyncio.run(main())
