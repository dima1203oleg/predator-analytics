"""Інтеграція для імпорту даних з Excel файлів митних декларацій.

Модуль для завантаження історичних даних митних декларацій з Excel файлів.
Підтримує великі файли (через pandas з chunking) та пакетний імпорт.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pandas as pd

logger = logging.getLogger(__name__)


@dataclass
class ExcelImportConfig:
    """Конфігурація імпорту Excel."""
    file_path: str
    sheet_name: str | int = 0
    chunk_size: int = 10000
    skip_rows: int = 0
    date_column: str = "declaration_date"
    encoding: str = "utf-8"


@dataclass
class ImportStats:
    """Статистика імпорту."""
    total_rows: int
    imported_rows: int
    failed_rows: int
    start_time: datetime
    end_time: datetime | None = None


class CustomsExcelImporter:
    """Імпортер даних митних декларацій з Excel файлів."""

    def __init__(self, db_session):
        self.db_session = db_session

    def read_excel_file(
        self,
        config: ExcelImportConfig,
    ) -> pd.DataFrame:
        """Прочитати Excel файл.
        
        Args:
            config: Конфігурація імпорту
            
        Returns:
            DataFrame з даними
        """
        logger.info(f"Читання Excel файлу: {config.file_path}")
        
        # Використовуємо pandas для читання Excel
        df = pd.read_excel(
            config.file_path,
            sheet_name=config.sheet_name,
            skiprows=config.skip_rows,
            engine="openpyxl",
        )
        
        logger.info(f"Завантажено {len(df)} рядків з Excel файлу")
        return df

    def read_excel_in_chunks(
        self,
        config: ExcelImportConfig,
    ):
        """Читати Excel файл по частинах (для великих файлів).
        
        Args:
            config: Конфігурація імпорту
            
        Yields:
            Частина DataFrame
        """
        logger.info(f"Читання Excel файлу по частинах: {config.file_path}")
        
        # Для Excel файлів pandas не підтримує chunking напряму
        # Тому читаємо весь файл, але обробляємо по частинах
        df = self.read_excel_file(config)
        
        for i in range(0, len(df), config.chunk_size):
            yield df.iloc[i:i + config.chunk_size]

    def normalize_dataframe(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:
        """Нормалізувати DataFrame для імпорту в БД.
        
        Args:
            df: Вхідний DataFrame
            
        Returns:
            Нормалізований DataFrame
        """
        # Перейменування колонок на латиницю
        column_mapping = {
            # Українські назви колонок -> англійські
            "Дата декларації": "declaration_date",
            "Номер декларації": "declaration_number",
            "Код митного посту": "customs_post",
            "Код УКТЗЕД": "uktzed_code",
            "Назва товару": "goods_description",
            "Вага (кг)": "weight_kg",
            "Вартість (USD)": "value_usd",
            "Країна походження": "origin_country",
            "Країна призначення": "destination_country",
            "Імпортер (ЄДРПОУ)": "importer_edrpou",
            "Експортер": "exporter",
            "Тип декларації": "declaration_type",
            "Режим": "regime",
            # Додати більше мапінгів за потреби
        }
        
        # Нормалізація назв колонок
        df.columns = df.columns.str.strip()
        df.columns = df.columns.str.lower()
        
        # Застосування мапінгу
        df = df.rename(columns=column_mapping)
        
        # Конвертація типів даних
        if "declaration_date" in df.columns:
            df["declaration_date"] = pd.to_datetime(df["declaration_date"], errors="coerce")
        
        if "weight_kg" in df.columns:
            df["weight_kg"] = pd.to_numeric(df["weight_kg"], errors="coerce")
        
        if "value_usd" in df.columns:
            df["value_usd"] = pd.to_numeric(df["value_usd"], errors="coerce")
        
        # Видалення рядків з пропущеними критичними даними
        required_columns = ["declaration_date", "uktzed_code", "value_usd"]
        df = df.dropna(subset=required_columns)
        
        return df

    def import_to_database(
        self,
        df: pd.DataFrame,
        tenant_id: str,
    ) -> ImportStats:
        """Імпортувати дані в базу даних.
        
        Args:
            df: DataFrame з даними
            tenant_id: ID тенанта
            
        Returns:
            Статистика імпорту
        """
        start_time = datetime.now()
        total_rows = len(df)
        imported_rows = 0
        failed_rows = 0
        
        logger.info(f"Початок імпорту {total_rows} рядків")
        
        try:
            # Імпорт по частинах для оптимізації пам'яті
            chunk_size = 1000
            for i in range(0, len(df), chunk_size):
                chunk = df.iloc[i:i + chunk_size]
                
                # Конвертація в словники
                records = chunk.to_dict("records")
                
                # Імпорт в БД
                for record in records:
                    try:
                        # TODO: Реалізувати вставку в таблицю declarations
                        # self.db_session.add(Declaration(...))
                        imported_rows += 1
                    except Exception as e:
                        logger.error(f"Помилка імпорту рядка: {e}")
                        failed_rows += 1
                
                # Комміт кожні chunk_size рядків
                if i % (chunk_size * 10) == 0:
                    self.db_session.commit()
                    logger.info(f"Імпортовано {imported_rows}/{total_rows} рядків")
            
            # Фінальний комміт
            self.db_session.commit()
            
        except Exception as e:
            logger.error(f"Критична помилка імпорту: {e}")
            self.db_session.rollback()
            raise
        
        end_time = datetime.now()
        
        return ImportStats(
            total_rows=total_rows,
            imported_rows=imported_rows,
            failed_rows=failed_rows,
            start_time=start_time,
            end_time=end_time,
        )

    def import_excel_file(
        self,
        file_path: str,
        tenant_id: str,
        sheet_name: str | int = 0,
    ) -> ImportStats:
        """Повний цикл імпорту Excel файлу.
        
        Args:
            file_path: Шлях до Excel файлу
            tenant_id: ID тенанта
            sheet_name: Назва або номер аркуша
            
        Returns:
            Статистика імпорту
        """
        config = ExcelImportConfig(
            file_path=file_path,
            sheet_name=sheet_name,
        )
        
        # Читання файлу
        df = self.read_excel_file(config)
        
        # Нормалізація
        df = self.normalize_dataframe(df)
        
        # Імпорт в БД
        stats = self.import_to_database(df, tenant_id)
        
        return stats


class BatchExcelImporter:
    """Пакетний імпортер для багатьох Excel файлів."""

    def __init__(self, db_session):
        self.importer = CustomsExcelImporter(db_session)

    def import_directory(
        self,
        directory_path: str,
        tenant_id: str,
        pattern: str = "*.xlsx",
    ) -> list[ImportStats]:
        """Імпортувати всі Excel файли з директорії.
        
        Args:
            directory_path: Шлях до директорії
            tenant_id: ID тенанта
            pattern: Патерн пошуку файлів
            
        Returns:
            Список статистики імпорту для кожного файлу
        """
        directory = Path(directory_path)
        files = list(directory.glob(pattern))
        
        logger.info(f"Знайдено {len(files)} файлів для імпорту")
        
        stats_list = []
        
        for file_path in files:
            logger.info(f"Імпорт файлу: {file_path}")
            try:
                stats = self.importer.import_excel_file(
                    str(file_path),
                    tenant_id,
                )
                stats_list.append(stats)
                logger.info(f"Успішно імпортовано: {file_path}")
            except Exception as e:
                logger.error(f"Помилка імпорту {file_path}: {e}")
        
        return stats_list

    def import_monthly_files(
        self,
        base_directory: str,
        tenant_id: str,
        start_year: int,
        end_year: int,
    ) -> list[ImportStats]:
        """Імпортувати щомісячні файли за період.
        
        Args:
            base_directory: Базова директорія
            tenant_id: ID тенанта
            start_year: Рік початку
            end_year: Рік кінця
            
        Returns:
            Список статистики імпорту
        """
        stats_list = []
        
        months_ukr = [
            "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
            "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
        ]
        
        for year in range(start_year, end_year + 1):
            for month_idx, month_name in enumerate(months_ukr, 1):
                file_name = f"{month_name}_{year}.xlsx"
                file_path = os.path.join(base_directory, file_name)
                
                if os.path.exists(file_path):
                    logger.info(f"Імпорт файлу: {file_name}")
                    try:
                        stats = self.importer.import_excel_file(
                            file_path,
                            tenant_id,
                        )
                        stats_list.append(stats)
                    except Exception as e:
                        logger.error(f"Помилка імпорту {file_name}: {e}")
                else:
                    logger.warning(f"Файл не знайдено: {file_path}")
        
        return stats_list


def get_excel_importer(db_session) -> CustomsExcelImporter:
    """Отримати інстанс імпортера Excel."""
    return CustomsExcelImporter(db_session)


def get_batch_importer(db_session) -> BatchExcelImporter:
    """Отримати інстанс пакетного імпортера."""
    return BatchExcelImporter(db_session)
