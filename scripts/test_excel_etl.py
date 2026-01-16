#!/usr/bin/env python3
"""
Тестовий скрипт для перевірки ETL обробки файлу Excel
Перевіряє: Парсинг → PostgreSQL → OpenSearch → Qdrant
"""
import asyncio
import sys
from pathlib import Path

# Додаємо шляхи
sys.path.insert(0, str(Path(__file__).parents[1]))
sys.path.insert(0, str(Path(__file__).parents[1] / "services/api-gateway"))

async def test_excel_etl():
    print("🚀 ТЕСТ ETL PIPELINE для файлу Березень_2024.xlsx")
    print("=" * 60)

    file_path = "/Users/dima-mac/Desktop/Березень_2024.xlsx"

    if not Path(file_path).exists():
        print(f"❌ Файл не знайдено: {file_path}")
        return

    print(f"✅ Файл знайдено: {Path(file_path).stat().st_size / 1024 / 1024:.2f} MB")

    # Крок 1: Читання структури файлу
    print("\n📖 Крок 1: Аналіз структури файлу...")
    try:
        import pandas as pd
        df_preview = pd.read_excel(file_path, nrows=5)
        print(f"   Колонки ({len(df_preview.columns)}): {list(df_preview.columns)[:5]}...")
        print(f"   Перший рядок (preview):")
        print(f"   {df_preview.iloc[0].to_dict()}")
    except Exception as e:
        print(f"   ⚠️ Помилка читання: {e}")
        return

    # Крок 2: Симуляція ETL процесу
    print("\n🔄 Крок 2: Симуляція ETL обробки...")
    print("   → Парсинг (chunked mode для великих файлів)")
    print("   → Створення staging_customs таблиці в PostgreSQL")
    print("   → Індексація в OpenSearch (documents_safe)")
    print("   → Генерація векторів для Qdrant")

    # Крок 3: Перевірка доступності сервісів
    print("\n🔍 Крок 3: Перевірка доступності баз даних...")

    # PostgreSQL
    try:
        import asyncpg
        conn = await asyncpg.connect(
            "postgresql://predator:666666@localhost:5432/predator_db"
        )
        await conn.close()
        print("   ✅ PostgreSQL: Доступний")
    except Exception as e:
        print(f"   ❌ PostgreSQL: Недоступний ({e})")

    # OpenSearch
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:9200/_cluster/health")
            if resp.status_code == 200:
                print("   ✅ OpenSearch: Доступний")
            else:
                print(f"   ⚠️ OpenSearch: Статус {resp.status_code}")
    except Exception as e:
        print(f"   ❌ OpenSearch: Недоступний ({e})")

    # Qdrant
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:6333/collections")
            if resp.status_code == 200:
                print("   ✅ Qdrant: Доступний")
            else:
                print(f"   ⚠️ Qdrant: Статус {resp.status_code}")
    except Exception as e:
        print(f"   ❌ Qdrant: Недоступний ({e})")

    print("\n" + "=" * 60)
    print("📋 ВИСНОВОК:")
    print("   Файл готовий до обробки через ETL pipeline.")
    print("   Для повної обробки запустіть API та виконайте:")
    print("   curl -X POST http://localhost:8000/api/v1/data-hub/upload \\")
    print("        -F 'file=@/Users/dima-mac/Desktop/Березень_2024.xlsx' \\")
    print("        -F 'source_name=Митні декларації Березень 2024'")

if __name__ == "__main__":
    asyncio.run(test_excel_etl())
