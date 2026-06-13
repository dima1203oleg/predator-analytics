"""Neo4j Auto-Sync для Autonomous Schema Synthesis (ASS).

PREDATOR Analytics v61.0-ELITE
Кіллер-фіча #1: Асиметрична перевага над Palantir Foundry

Цей модуль відповідає за:
1. Синхронізацію еволюційної схеми з Neo4j
2. Backfill нових зв'язків для існуючих даних
3. Моніторинг стану синхронізації
4. Обробку помилок та retry логіку
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

from app.config import settings
from app.core.schema_evolution import SchemaUpdate

logger = logging.getLogger("predator.ingestion.neo4j_auto_sync")


class SyncStatus(Enum):
    """Статус синхронізації."""
    IDLE = "IDLE"
    SYNCING = "SYNCING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    RETRYING = "RETRYING"


@dataclass
class SyncResult:
    """Результат синхронізації."""
    sync_id: str
    status: SyncStatus
    relationships_created: int = 0
    relationships_failed: int = 0
    nodes_created: int = 0
    nodes_failed: int = 0
    error_message: str | None = None
    duration_ms: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    
    def to_dict(self) -> dict[str, Any]:
        return {
            "sync_id": self.sync_id,
            "status": self.status.value,
            "relationships_created": self.relationships_created,
            "relationships_failed": self.relationships_failed,
            "nodes_created": self.nodes_created,
            "nodes_failed": self.nodes_failed,
            "error_message": self.error_message,
            "duration_ms": self.duration_ms,
            "timestamp": self.timestamp,
        }


@dataclass
class BackfillResult:
    """Результат backfill операції."""
    pattern_id: str
    relationship_type: str
    relationships_backfilled: int = 0
    duration_ms: float = 0.0
    status: SyncStatus = SyncStatus.COMPLETED
    error_message: str | None = None


class Neo4jAutoSync:
    """Автоматична синхронізація схеми з Neo4j.
    
    Функціонал:
    1. Застосування оновлень схеми
    2. Backfill нових зв'язків
    3. Моніторинг стану
    4. Retry логіка
    """
    
    def __init__(self, neo4j_driver=None):
        self.neo4j_driver = neo4j_driver
        if not self.neo4j_driver:
            try:
                from neo4j import AsyncGraphDatabase
                self.neo4j_driver = AsyncGraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                )
            except Exception as e:
                logger.warning(f"Не вдалося ініціалізувати Neo4j драйвер: {e}")
        self._status = SyncStatus.IDLE
        self._current_sync_id: str | None = None
        self._retry_count = 0
        self._max_retries = 3
        
    async def apply_schema_update(self, update: SchemaUpdate) -> SyncResult:
        """Застосовує оновлення схеми до Neo4j.
        
        Args:
            update: SchemaUpdate для застосування
            
        Returns:
            SyncResult з деталями синхронізації
        """
        import time
        start_time = time.time()
        
        sync_id = self._generate_sync_id()
        self._current_sync_id = sync_id
        self._status = SyncStatus.SYNCING
        
        logger.info(f"Початок синхронізації схеми: {sync_id}")
        
        if not self.neo4j_driver:
            error = "Neo4j драйвер не доступний"
            logger.warning(error)
            self._status = SyncStatus.FAILED
            return SyncResult(
                sync_id=sync_id,
                status=SyncStatus.FAILED,
                error_message=error,
                duration_ms=(time.time() - start_time) * 1000
            )
        
        try:
            relationships_created = 0
            relationships_failed = 0
            
            async with self.neo4j_driver.session() as session:
                for command in update.cypher_commands:
                    try:
                        await session.run(command)
                        relationships_created += 1
                        logger.debug(f"Виконано команду: {command[:100]}...")
                    except Exception as e:
                        relationships_failed += 1
                        logger.warning(f"Помилка виконання команди: {e}")
                        # Продовжуємо з іншими командами
            
            duration = (time.time() - start_time) * 1000
            self._status = SyncStatus.COMPLETED
            
            logger.info(
                f"Схема успішно синхронізована: {sync_id} "
                f"(створено: {relationships_created}, помилок: {relationships_failed}, "
                f"час: {duration:.2f}ms)"
            )
            
            return SyncResult(
                sync_id=sync_id,
                status=SyncStatus.COMPLETED,
                relationships_created=relationships_created,
                relationships_failed=relationships_failed,
                duration_ms=duration
            )
            
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            self._status = SyncStatus.FAILED
            error_message = str(e)
            
            logger.exception(f"Помилка синхронізації схеми: {sync_id} - {error_message}")
            
            return SyncResult(
                sync_id=sync_id,
                status=SyncStatus.FAILED,
                error_message=error_message,
                duration_ms=duration
            )
    
    async def backfill_relationships(
        self, 
        relationship_type: str,
        pattern_id: str,
        sample_size: int = 1000
    ) -> BackfillResult:
        """Заповнює нові зв'язки для існуючих даних.
        
        Args:
            relationship_type: Тип зв'язку для backfill
            pattern_id: ID патерну
            sample_size: Розмір вибірки для backfill
            
        Returns:
            BackfillResult з деталями операції
        """
        import time
        start_time = time.time()
        
        logger.info(f"Початок backfill для {relationship_type}: {pattern_id}")
        
        if not self.neo4j_driver:
            return BackfillResult(
                pattern_id=pattern_id,
                relationship_type=relationship_type,
                status=SyncStatus.FAILED,
                error_message="Neo4j драйвер не доступний"
            )
        
        try:
            # Генеруємо Cypher для backfill на основі типу зв'язку
            cypher = self._generate_backfill_cypher(relationship_type, sample_size)
            
            async with self.neo4j_driver.session() as session:
                result = await session.run(cypher)
                summary = result.summary()
                count = summary.counters.relationships_created if summary.counters else 0
            
            duration = (time.time() - start_time) * 1000
            
            logger.info(
                f"Backfill завершено для {relationship_type}: "
                f"{count} зв'язків створено ({duration:.2f}ms)"
            )
            
            return BackfillResult(
                pattern_id=pattern_id,
                relationship_type=relationship_type,
                relationships_backfilled=count,
                duration_ms=duration,
                status=SyncStatus.COMPLETED
            )
            
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            error_message = str(e)
            
            logger.exception(f"Помилка backfill для {relationship_type}: {error_message}")
            
            return BackfillResult(
                pattern_id=pattern_id,
                relationship_type=relationship_type,
                status=SyncStatus.FAILED,
                error_message=error_message,
                duration_ms=duration
            )
    
    async def batch_backfill(
        self,
        relationship_types: list[str],
        pattern_ids: list[str]
    ) -> list[BackfillResult]:
        """Batch backfill для кількох типів зв'язків.
        
        Args:
            relationship_types: Список типів зв'язків
            pattern_ids: Список ID патернів
            
        Returns:
            Список BackfillResult
        """
        results = []
        
        for rel_type, pattern_id in zip(relationship_types, pattern_ids):
            result = await self.backfill_relationships(rel_type, pattern_id)
            results.append(result)
            
            # Невелика затримка між операціями
            await asyncio.sleep(0.1)
        
        return results
    
    def get_status(self) -> SyncStatus:
        """Отримати поточний статус синхронізації."""
        return self._status
    
    def get_current_sync_id(self) -> str | None:
        """Отримати ID поточної синхронізації."""
        return self._current_sync_id
    
    async def retry_sync(self, update: SchemaUpdate) -> SyncResult:
        """Retry синхронізації з обмеженням кількості спроб.
        
        Args:
            update: SchemaUpdate для повторної синхронізації
            
        Returns:
            SyncResult з деталями повторної спроби
        """
        if self._retry_count >= self._max_retries:
            logger.error(f"Досягнуто максимум retry спроб: {self._max_retries}")
            return SyncResult(
                sync_id=self._generate_sync_id(),
                status=SyncStatus.FAILED,
                error_message=f"Максимум retry спроб досягнуто ({self._max_retries})"
            )
        
        self._retry_count += 1
        self._status = SyncStatus.RETRYING
        
        logger.info(f"Retry синхронізації (спроба {self._retry_count}/{self._max_retries})")
        
        # Затримка перед retry (експоненційна)
        delay = min(2 ** self._retry_count, 60)  # Максимум 60 секунд
        await asyncio.sleep(delay)
        
        result = await self.apply_schema_update(update)
        
        if result.status == SyncStatus.COMPLETED:
            self._retry_count = 0  # Скидаємо лічильник при успіху
        
        return result
    
    # --- Private methods ---
    
    def _generate_backfill_cypher(self, relationship_type: str, sample_size: int) -> str:
        """Генерує Cypher для backfill нових зв'язків.
        
        Стратегія backfill залежить від типу зв'язку:
        - MUTUAL_BENEFICIARY: компанії зі спільними бенефіціарами
        - MONEY_LAUNDERING_PATH: ланцюжки транзакцій
        - SHELL_COMPANY_CLUSTER: компанії за однією адресою
        """
        rel_type_upper = relationship_type.upper()
        
        if rel_type_upper == "MUTUAL_BENEFICIARY":
            # Знаходимо компанії зі спільними бенефіціарами
            return f"""
            // Auto-generated backfill for MUTUAL_BENEFICIARY
            // Generated at: {datetime.now(UTC).isoformat()}
            
            MATCH (p:Person)-[:OWNS|DIRECTS]->(c1:Company)
            MATCH (p)-[:OWNS|DIRECTS]->(c2:Company)
            WHERE c1 <> c2
            AND NOT (c1)-[:MUTUAL_BENEFICIARY]->(c2)
            WITH c1, c2, count(DISTINCT p) AS mutual_beneficiaries
            WHERE mutual_beneficiars >= 2
            LIMIT {sample_size}
            MERGE (c1)-[r:MUTUAL_BENEFICIARY]->(c2)
            SET r.created_at = datetime(),
                r.confidence = 0.8,
                r.mutual_beneficiars = mutual_beneficiars
            RETURN count(r) as created
            """
        
        elif rel_type_upper == "SHELL_COMPANY_CLUSTER":
            # Знаходимо компанії за однією адресою
            return f"""
            // Auto-generated backfill for SHELL_COMPANY_CLUSTER
            // Generated at: {datetime.now(UTC).isoformat()}
            
            MATCH (c1:Company)-[:REGISTERED_AT]->(a:Address)<-[:REGISTERED_AT]-(c2:Company)
            WHERE c1 <> c2
            AND NOT (c1)-[:SHELL_COMPANY_CLUSTER]->(c2)
            WITH a, collect(DISTINCT c1) + collect(DISTINCT c2) AS companies
            WHERE size(companies) >= 3
            LIMIT {sample_size}
            UNWIND companies AS c
            UNWIND companies AS other
            WITH c, other
            WHERE c <> other
            MERGE (c)-[r:SHELL_COMPANY_CLUSTER]->(other)
            SET r.created_at = datetime(),
                r.confidence = 0.7,
                r.cluster_address = a.full_address
            RETURN count(r) as created
            """
        
        elif rel_type_upper == "MONEY_LAUNDERING_PATH":
            # Знаходимо підозрілі ланцюжки транзакцій
            return f"""
            // Auto-generated backfill for MONEY_LAUNDERING_PATH
            // Generated at: {datetime.now(UTC).isoformat()}
            
            MATCH (c1:Company)-[:FILED]->(d1:Declaration)-[:CONTAINS]->(p:Product)<-[:CONTAINS]-(d2:Declaration)<-[:FILED]-(c2:Company)
            WHERE c1 <> c2
            AND d1.total_invoice_value > 100000
            AND d2.total_invoice_value > 100000
            AND NOT (c1)-[:MONEY_LAUNDERING_PATH]->(c2)
            WITH c1, c2, count(DISTINCT p) AS common_products
            WHERE common_products >= 2
            LIMIT {sample_size}
            MERGE (c1)-[r:MONEY_LAUNDERING_PATH]->(c2)
            SET r.created_at = datetime(),
                r.confidence = 0.6,
                r.common_products = common_products
            RETURN count(r) as created
            """
        
        else:
            # Загальний fallback для невідомих типів
            return f"""
            // Auto-generated backfill for {relationship_type}
            // Generated at: {datetime.now(UTC).isoformat()}
            
            // No specific backfill strategy defined for {relationship_type}
            // This is a placeholder for future implementation
            RETURN 0 as created
            """
    
    def _generate_sync_id(self) -> str:
        """Генерує унікальний ID для синхронізації."""
        import hashlib
        hash_input = f"{datetime.now(UTC).isoformat()}"
        hash_val = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
        return f"SYNC-{hash_val}"


# Singleton instance
neo4j_auto_sync = Neo4jAutoSync()


def get_neo4j_auto_sync() -> Neo4jAutoSync:
    """Отримати singleton екземпляр Neo4j Auto-Sync."""
    return neo4j_auto_sync
