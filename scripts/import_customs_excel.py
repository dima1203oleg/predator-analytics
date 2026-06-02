#!/usr/bin/env python3
"""Скрипт для пакетного імпорту Excel файлів митних декларацій.

Використання:
    python scripts/import_customs_excel.py --directory /path/to/excel/files --tenant-id <tenant_id>

Приклад:
    python scripts/import_customs_excel.py --directory /Users/dima1203/Desktop --tenant-id a0000000-0000-0000-0000-000000000001
"""

import argparse
import asyncio
import logging
import sys
from pathlib import Path

# Додавання проектного шляху до sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_async_session
from libs.core.etl.customs_declarations_etl import HistoricalDataLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def main():
    parser = argparse.ArgumentParser(
        description="Імпорт Excel файлів митних декларацій"
    )
    parser.add_argument(
        "--directory",
        required=True,
        help="Директорія з Excel файлами"
    )
    parser.add_argument(
        "--tenant-id",
        required=True,
        help="ID тенанта"
    )
    parser.add_argument(
        "--start-year",
        type=int,
        default=2019,
        help="Рік початку (за замовчуванням: 2019)"
    )
    parser.add_argument(
        "--end-year",
        type=int,
        default=2027,
        help="Рік кінця (за замовчуванням: 2027)"
    )
    parser.add_argument(
        "--estimate-only",
        action="store_true",
        help="Тільки оцінити обсяг даних без імпорту"
    )
    
    args = parser.parse_args()
    
    # Перевірка директорії
    directory = Path(args.directory)
    if not directory.exists():
        logger.error(f"Директорія не існує: {args.directory}")
        sys.exit(1)
    
    if not directory.is_dir():
        logger.error(f"Шлях не є директорією: {args.directory}")
        sys.exit(1)
    
    # Отримання сесії БД
    async with get_async_session() as db_session:
        loader = HistoricalDataLoader(db_session)
        
        if args.estimate_only:
            # Тільки оцінка обсягу
            logger.info("Оцінка обсягу даних...")
            estimate = await loader.estimate_data_volume(args.directory)
            
            print("\n" + "=" * 60)
            print("ОЦІНКА ОБСЯГУ ДАНИХ")
            print("=" * 60)
            print(f"Кількість файлів: {estimate['total_files']}")
            print(f"Загальний розмір: {estimate['total_size_mb']:.2f} MB")
            print(f"Середній розмір: {estimate['avg_size_mb']:.2f} MB")
            print(f"Оцінка рядків: {estimate['estimated_rows']:,}")
            print("=" * 60)
            
            # Оцінка часу імпорту (припускаємо ~1000 рядків/секунду)
            estimated_seconds = estimate['estimated_rows'] / 1000
            estimated_minutes = estimated_seconds / 60
            estimated_hours = estimated_minutes / 60
            
            print(f"Оцінка часу імпорту:")
            print(f"  - {estimated_seconds:.0f} секунд")
            print(f"  - {estimated_minutes:.0f} хвилин")
            print(f"  - {estimated_hours:.1f} годин")
            print("=" * 60)
            
        else:
            # Повний імпорт
            logger.info(f"Початок імпорту з {args.directory}")
            logger.info(f"Період: {args.start_year} - {args.end_year}")
            
            stats = await loader.load_historical_data(
                args.directory,
                args.tenant_id,
                args.start_year,
                args.end_year,
            )
            
            # Вивід результатів
            print("\n" + "=" * 60)
            print("РЕЗУЛЬТАТИ ІМПОРТУ")
            print("=" * 60)
            print(f"Загальна кількість файлів: {stats.total_files}")
            print(f"Оброблено файлів: {stats.processed_files}")
            print(f"Загальна кількість рядків: {stats.total_rows:,}")
            print(f"Імпортовано рядків: {stats.imported_rows:,}")
            print(f"Помилок: {stats.failed_rows:,}")
            
            if stats.end_time:
                duration = (stats.end_time - stats.start_time).total_seconds()
                print(f"Час виконання: {duration:.2f} секунд")
                
                if stats.imported_rows > 0:
                    rows_per_second = stats.imported_rows / duration
                    print(f"Швидкість: {rows_per_second:.0f} рядків/секунду")
            
            if stats.errors:
                print("\nПОМИЛКИ:")
                for error in stats.errors[:10]:  # Показати перші 10 помилок
                    print(f"  - {error}")
                if len(stats.errors) > 10:
                    print(f"  ... та ще {len(stats.errors) - 10} помилок")
            
            print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
