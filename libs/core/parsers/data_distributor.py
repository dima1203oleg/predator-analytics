"""Розподіл спаршених даних по базах даних.

Автоматично розподіляє дані з парсерів по відповідних базах:
- PostgreSQL (SSOT) - метадані, транзакції
- ClickHouse (OLAP) - аналітика
- OpenSearch (Search) - пошук
- Neo4j (Graph) - граф
- Qdrant (Vector) - вектори
- Redis (Cache) - кеш
- MinIO (S3) - файли
"""

from __future__ import annotations

import logging
import os
from typing import Any

from libs.core.etl.multi_database_etl import DatabaseConfig, MultiDatabaseETL
from libs.core.parsers.base import ParseResult

logger = logging.getLogger(__name__)


class DataDistributor:
    """Розподільник даних по базах."""

    def __init__(self, db_config: DatabaseConfig):
        self.db_config = db_config
        self.multi_db_etl = None

    async def initialize(self, db_session):
        """Ініціалізувати multi-database ETL.
        
        Args:
            db_session: Сесія бази даних

        """
        self.multi_db_etl = MultiDatabaseETL(self.db_config, db_session)

    async def distribute(self, parse_result: ParseResult) -> dict[str, int]:
        """Розподілити спаршені дані по базах.
        
        Args:
            parse_result: Результат парсингу
            
        Returns:
            Статистика розподілу

        """
        if not self.multi_db_etl:
            logger.error("Multi-database ETL не ініціалізовано")
            return {}

        logger.info(f"Розподіл {len(parse_result.data)} записів по базах")

        # Розподіл даних по базах
        result = await self.multi_db_etl.run(
            data_list=parse_result.data,
            commit_message=f"feat(parser): імпорт даних з {parse_result.source_url}"
        )

        return {
            "postgres": result.postgres_rows,
            "clickhouse": result.clickhouse_rows,
            "opensearch": result.opensearch_docs,
            "neo4j": result.neo4j_nodes,
            "qdrant": result.qdrant_vectors,
            "redis": result.redis_keys,
            "minio": result.minio_objects,
        }

    async def distribute_to_postgres(self, data: dict[str, Any]) -> int:
        """Розподілити дані в PostgreSQL.
        
        Args:
            data: Дані для розподілу
            
        Returns:
            Кількість вставлених рядків

        """
        if not self.multi_db_etl:
            return 0

        return await self.multi_db_etl.import_to_postgresql(data)

    async def distribute_to_clickhouse(self, data: dict[str, Any]) -> int:
        """Розподілити дані в ClickHouse.
        
        Args:
            data: Дані для розподілу
            
        Returns:
            Кількість вставлених рядків

        """
        if not self.multi_db_etl:
            return 0

        return await self.multi_db_etl.import_to_clickhouse(data)

    async def distribute_to_opensearch(self, data: dict[str, Any]) -> int:
        """Розподілити дані в OpenSearch.
        
        Args:
            data: Дані для розподілу
            
        Returns:
            Кількість вставлених документів

        """
        if not self.multi_db_etl:
            return 0

        return await self.multi_db_etl.import_to_opensearch(data)

    async def distribute_to_neo4j(self, data: dict[str, Any]) -> tuple[int, int]:
        """Розподілити дані в Neo4j.
        
        Args:
            data: Дані для розподілу
            
        Returns:
            Кількість вузлів, кількість зв'язків

        """
        if not self.multi_db_etl:
            return (0, 0)

        return await self.multi_db_etl.import_to_neo4j(data)

    async def distribute_to_qdrant(self, data: dict[str, Any]) -> int:
        """Розподілити дані в Qdrant.
        
        Args:
            data: Дані для розподілу
            
        Returns:
            Кількість вставлених векторів

        """
        if not self.multi_db_etl:
            return 0

        return await self.multi_db_etl.import_to_qdrant(data)

    async def distribute_to_redis(self, data: dict[str, Any]) -> int:
        """Розподілити дані в Redis.
        
        Args:
            data: Дані для розподілу
            
        Returns:
            Кількість вставлених ключів

        """
        if not self.multi_db_etl:
            return 0

        return await self.multi_db_etl.import_to_redis(data)

    async def distribute_to_minio(self, data: dict[str, Any]) -> int:
        """Розподілити дані в MinIO.
        
        Args:
            data: Дані для розподілу
            
        Returns:
            Кількість вставлених об'єктів

        """
        if not self.multi_db_etl:
            return 0

        return await self.multi_db_etl.import_to_minio(data)


def get_data_distributor(db_config: DatabaseConfig) -> DataDistributor:
    """Отримати інстанс розподільника даних.
    
    Args:
        db_config: Конфігурація бази даних
        
    Returns:
        Інстанс розподільника

    """
    return DataDistributor(db_config)


def get_default_db_config() -> DatabaseConfig:
    """Отримати конфігурацію бази даних з env vars."""
    return DatabaseConfig(
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
