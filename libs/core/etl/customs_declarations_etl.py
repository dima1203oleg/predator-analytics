"""ETL процес для завантаження історичних даних митних декларацій.

Модуль для завантаження та обробки історичних даних митних декларацій
за період 5-8 років (60-96 місяців) з розподілом по 8 базах даних.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


@dataclass
class ETLConfig:
    """Конфігурація ETL процесу."""
    source_directory: str
    tenant_id: str
    start_year: int
    end_year: int
    batch_size: int = 10000
    parallel_workers: int = 4


@dataclass
class ETLStats:
    """Статистика ETL процесу."""
    total_files: int
    processed_files: int
    total_rows: int
    imported_rows: int
    failed_rows: int
    start_time: datetime
    end_time: datetime | None = None
    errors: list[str] = None


class CustomsDeclarationsETL:
    """ETL процес для митних декларацій з multi-database підтримкою."""

    def __init__(self, db_session: AsyncSession, config: ETLConfig):
        self.db_session = db_session
        self.config = config
        self.stats = ETLStats(
            total_files=0,
            processed_files=0,
            total_rows=0,
            imported_rows=0,
            failed_rows=0,
            start_time=datetime.now(),
            errors=[],
        )
        # Ініціалізація multi-database ETL
        from libs.core.etl.multi_database_etl import MultiDatabaseETL, DatabaseConfig
        
        self.multi_db_config = DatabaseConfig(
            postgres_url=os.getenv("DATABASE_URL", ""),
            clickhouse_host=os.getenv("CLICKHOUSE_HOST", "localhost"),
            clickhouse_port=int(os.getenv("CLICKHOUSE_PORT", "8123")),
            clickhouse_user=os.getenv("CLICKHOUSE_USER", "default"),
            clickhouse_password=os.getenv("CLICKHOUSE_PASSWORD", ""),
            clickhouse_database=os.getenv("CLICKHOUSE_DATABASE", "predator"),
            opensearch_url=os.getenv("OPENSEARCH_URL", "http://localhost:9200"),
            opensearch_index=os.getenv("OPENSEARCH_INDEX", "declarations"),
            neo4j_uri=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            neo4j_user=os.getenv("NEO4J_USER", "neo4j"),
            neo4j_password=os.getenv("NEO4J_PASSWORD", "neo4j"),
            qdrant_url=os.getenv("QDRANT_URL", "http://localhost:6333"),
            qdrant_api_key=os.getenv("QDRANT_API_KEY"),
            redis_host=os.getenv("REDIS_HOST", "localhost"),
            redis_port=int(os.getenv("REDIS_PORT", "6379")),
            redis_password=os.getenv("REDIS_PASSWORD"),
            minio_endpoint=os.getenv("MINIO_ENDPOINT", "localhost:9000"),
            minio_access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
            minio_secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
            minio_bucket=os.getenv("MINIO_BUCKET", "declarations"),
        )
        self.multi_db_etl = MultiDatabaseETL(self.multi_db_config, db_session)

    async def validate_source_directory(self) -> bool:
        """Перевірити наявність директорії з джерелом даних."""
        source_dir = Path(self.config.source_directory)
        if not source_dir.exists():
            logger.error(f"Директорія не існує: {self.config.source_directory}")
            return False
        if not source_dir.is_dir():
            logger.error(f"Шлях не є директорією: {self.config.source_directory}")
            return False
        return True

    async def discover_files(self) -> list[Path]:
        """Знайти всі Excel файли в директорії."""
        source_dir = Path(self.config.source_directory)
        files = list(source_dir.glob("*.xlsx"))
        files.extend(source_dir.glob("*.xls"))
        
        self.stats.total_files = len(files)
        logger.info(f"Знайдено {len(files)} Excel файлів")
        
        return files

    async def check_existing_data(
        self,
        file_path: str,
    ) -> bool:
        """Перевірити чи дані з файлу вже імпортовані.
        
        Args:
            file_path: Шлях до файлу
            
        Returns:
            True якщо дані вже імпортовані
        """
        # TODO: Реалізувати перевірку по хешу файлу або метаданих
        return False

    async def process_file(
        self,
        file_path: Path,
    ) -> dict[str, Any]:
        """Обробити один файл з розподілом по 8 базах даних.
        
        Args:
            file_path: Шлях до файлу
            
        Returns:
            Результат обробки
        """
        from libs.core.integrations.customs_excel_import import CustomsExcelImporter
        
        logger.info(f"Обробка файлу: {file_path.name}")
        
        # Перевірити чи вже імпортовано
        if await self.check_existing_data(str(file_path)):
            logger.info(f"Файл вже імпортовано: {file_path.name}")
            return {"status": "skipped", "file": str(file_path)}
        
        # Створити імпортер
        importer = CustomsExcelImporter(self.db_session)
        
        try:
            # Прочитати та нормалізувати дані з Excel
            from libs.core.integrations.customs_excel_import import ExcelImportConfig
            
            config = ExcelImportConfig(
                file_path=str(file_path),
                sheet_name=0,
                chunk_size=10000,
            )
            
            df = importer.read_excel_file(config)
            df = importer.normalize_dataframe(df)
            
            # Конвертувати в список словників
            data_list = df.to_dict("records")
            
            # Розподілити по 8 базах даних через multi-database ETL
            commit_message = f"feat(etl): імпорт митних декларацій з {file_path.name}"
            multi_db_result = await self.multi_db_etl.run(data_list, commit_message)
            
            self.stats.processed_files += 1
            self.stats.total_rows += len(data_list)
            self.stats.imported_rows += multi_db_result.postgres_rows
            self.stats.failed_rows += len(multi_db_result.errors)
            
            logger.info(
                f"Успішно імпортовано в 8 баз даних: "
                f"PG={multi_db_result.postgres_rows}, "
                f"CH={multi_db_result.clickhouse_rows}, "
                f"OS={multi_db_result.opensearch_docs}, "
                f"Neo4j={multi_db_result.neo4j_nodes}, "
                f"Qdrant={multi_db_result.qdrant_vectors}, "
                f"Redis={multi_db_result.redis_keys}, "
                f"MinIO={multi_db_result.minio_objects}"
            )
            
            return {
                "status": "success",
                "file": str(file_path),
                "imported": multi_db_result.postgres_rows,
                "failed": len(multi_db_result.errors),
                "multi_db_result": {
                    "postgres": multi_db_result.postgres_rows,
                    "clickhouse": multi_db_result.clickhouse_rows,
                    "opensearch": multi_db_result.opensearch_docs,
                    "neo4j": multi_db_result.neo4j_nodes,
                    "qdrant": multi_db_result.qdrant_vectors,
                    "redis": multi_db_result.redis_keys,
                    "minio": multi_db_result.minio_objects,
                },
            }
            
        except Exception as e:
            error_msg = f"Помилка імпорту {file_path.name}: {e}"
            logger.error(error_msg)
            self.stats.errors.append(error_msg)
            
            return {
                "status": "error",
                "file": str(file_path),
                "error": str(e),
            }

    async def run(self) -> ETLStats:
        """Запустити ETL процес.
        
        Returns:
            Статистика ETL процесу
        """
        logger.info("Початок ETL процесу")
        
        # Перевірити директорію
        if not await self.validate_source_directory():
            raise ValueError("Невірна директорія джерела")
        
        # Знайти файли
        files = await self.discover_files()
        
        if not files:
            logger.warning("Файли не знайдено")
            return self.stats
        
        # Обробити файли
        for file_path in files:
            result = await self.process_file(file_path)
            
            if result["status"] == "error":
                logger.error(f"Помилка обробки: {result['error']}")
        
        # Завершити
        self.stats.end_time = datetime.now()
        
        duration = (self.stats.end_time - self.stats.start_time).total_seconds()
        logger.info(f"ETL процес завершено за {duration:.2f} секунд")
        logger.info(f"Оброблено файлів: {self.stats.processed_files}/{self.stats.total_files}")
        logger.info(f"Імпортовано рядків: {self.stats.imported_rows}")
        logger.info(f"Помилок: {self.stats.failed_rows}")
        
        return self.stats

    async def run_monthly_import(
        self,
    ) -> ETLStats:
        """Запустити імпорт щомісячних файлів.
        
        Returns:
            Статистика ETL процесу
        """
        months_ukr = [
            "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
            "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
        ]
        
        source_dir = Path(self.config.source_directory)
        files_to_process = []
        
        for year in range(self.config.start_year, self.config.end_year + 1):
            for month_idx, month_name in enumerate(months_ukr, 1):
                file_name = f"{month_name}_{year}.xlsx"
                file_path = source_dir / file_name
                
                if file_path.exists():
                    files_to_process.append(file_path)
                    logger.info(f"Знайдено файл: {file_name}")
                else:
                    logger.warning(f"Файл не знайдено: {file_name}")
        
        self.stats.total_files = len(files_to_process)
        
        # Обробити файли
        for file_path in files_to_process:
            await self.process_file(file_path)
        
        # Завершити
        self.stats.end_time = datetime.now()
        
        return self.stats


class HistoricalDataLoader:
    """Завантажувач історичних даних."""

    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def load_historical_data(
        self,
        source_directory: str,
        tenant_id: str,
        start_year: int = 2019,
        end_year: int = 2027,
    ) -> ETLStats:
        """Завантажити історичні дані за період.
        
        Args:
            source_directory: Директорія з Excel файлами
            tenant_id: ID тенанта
            start_year: Рік початку
            end_year: Рік кінця
            
        Returns:
            Статистика завантаження
        """
        config = ETLConfig(
            source_directory=source_directory,
            tenant_id=tenant_id,
            start_year=start_year,
            end_year=end_year,
        )
        
        etl = CustomsDeclarationsETL(self.db_session, config)
        stats = await etl.run_monthly_import()
        
        return stats

    async def estimate_data_volume(
        self,
        source_directory: str,
    ) -> dict[str, Any]:
        """Оцінити обсяг даних.
        
        Args:
            source_directory: Директорія з Excel файлами
            
        Returns:
            Оцінка обсягу даних
        """
        source_dir = Path(source_directory)
        files = list(source_dir.glob("*.xlsx"))
        
        total_size = sum(f.stat().st_size for f in files)
        avg_size = total_size / len(files) if files else 0
        
        # Оцінка кількості рядків (припускаємо ~1KB на рядок)
        estimated_rows = int(total_size / 1024)
        
        return {
            "total_files": len(files),
            "total_size_mb": total_size / (1024 * 1024),
            "avg_size_mb": avg_size / (1024 * 1024),
            "estimated_rows": estimated_rows,
        }


async def run_customs_etl(
    db_session: AsyncSession,
    source_directory: str,
    tenant_id: str,
    start_year: int = 2019,
    end_year: int = 2027,
) -> ETLStats:
    """Запустити ETL процес для митних декларацій.
    
    Args:
        db_session: Сесія бази даних
        source_directory: Директорія з Excel файлами
        tenant_id: ID тенанта
        start_year: Рік початку
        end_year: Рік кінця
        
    Returns:
        Статистика ETL процесу
    """
    loader = HistoricalDataLoader(db_session)
    stats = await loader.load_historical_data(
        source_directory,
        tenant_id,
        start_year,
        end_year,
    )
    return stats
