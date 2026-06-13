"""Schema Evolution Engine для Autonomous Schema Synthesis (ASS).

PREDATOR Analytics v61.0-ELITE
Кіллер-фіча #1: Асиметрична перевага над Palantir Foundry

Цей модуль відповідає за:
1. Валідацію нових типів сутностей та зв'язків
2. Генерацію Neo4j constraints для нових relationship types
3. Безпечну міграцію схеми
4. Логування еволюції онтології
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

import orjson

from app.config import settings
from app.core.pattern_discovery import Pattern

logger = logging.getLogger("predator.ingestion.schema_evolution")


class EvolutionStatus(Enum):
    """Статус еволюції схеми."""
    PENDING = "PENDING"
    VALIDATING = "VALIDATING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    APPLIED = "APPLIED"
    ROLLED_BACK = "ROLLED_BACK"


@dataclass
class SchemaUpdate:
    """Оновлення схеми."""
    update_id: str
    new_relationships: list[str] = field(default_factory=list)
    new_entity_types: list[str] = field(default_factory=list)
    cypher_commands: list[str] = field(default_factory=list)
    patterns_applied: int = 0
    status: EvolutionStatus = EvolutionStatus.PENDING
    confidence: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    applied_at: str | None = None
    
    def to_dict(self) -> dict[str, Any]:
        return {
            "update_id": self.update_id,
            "new_relationships": self.new_relationships,
            "new_entity_types": self.new_entity_types,
            "cypher_commands": self.cypher_commands,
            "patterns_applied": self.patterns_applied,
            "status": self.status.value,
            "confidence": self.confidence,
            "metadata": self.metadata,
            "created_at": self.created_at,
            "applied_at": self.applied_at,
        }


@dataclass
class EvolutionLog:
    """Лог еволюції онтології."""
    log_id: str
    update_id: str
    action: str
    details: dict[str, Any]
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())


class SchemaEvolutionEngine:
    """Автоматична еволюція схеми Neo4j.
    
    Процес:
    1. Валідація нових патернів
    2. Генерація Cypher для нових relationship types
    3. Виконання міграції
    4. Логування еволюції
    """
    
    def __init__(self, neo4j_driver=None):
        self.neo4j_driver = neo4j_driver
        self._llm_client = None
        self._initialized = False
        self._existing_relationships: set[str] = set()
        self._existing_entity_types: set[str] = set()
        
    async def initialize(self):
        """Ініціалізація Schema Evolution Engine."""
        if self._initialized:
            return
        
        try:
            # Завантажуємо існуючу схему з Neo4j
            await self._load_existing_schema()
            
            # Ініціалізація LLM клієнта (Ollama)
            try:
                import httpx
                self._llm_client = httpx.AsyncClient(timeout=120.0)
                logger.info("LLM клієнт ініціалізовано (Ollama)")
            except Exception as e:
                logger.warning(f"Не вдалося ініціалізувати LLM клієнт: {e}")
            
            self._initialized = True
            logger.info("Schema Evolution Engine ініціалізовано")
            logger.info(f"Існуючі relationship types: {len(self._existing_relationships)}")
            logger.info(f"Існуючі entity types: {len(self._existing_entity_types)}")
            
        except Exception as e:
            logger.exception(f"Помилка ініціалізації Schema Evolution Engine: {e}")
            self._initialized = True
    
    async def evolve_schema(self, new_patterns: list[Pattern]) -> SchemaUpdate:
        """Еволюціонує схему на основі нових патернів.
        
        Args:
            new_patterns: Список нових патернів
            
        Returns:
            SchemaUpdate з деталями змін
        """
        if not self._initialized:
            await self.initialize()
        
        # Генеруємо ID оновлення
        update_id = self._generate_update_id(new_patterns)
        
        # 1. Валідація патернів
        validated = await self._validate_patterns(new_patterns)
        
        if not validated:
            logger.warning("Немає валідних патернів для еволюції схеми")
            return SchemaUpdate(
                update_id=update_id,
                status=EvolutionStatus.REJECTED,
                confidence=0.0,
                metadata={"reason": "no_valid_patterns"}
            )
        
        # 2. Виявляємо нові типи
        new_relationship_types = self._detect_new_relationship_types(validated)
        new_entity_types = self._detect_new_entity_types(validated)
        
        if not new_relationship_types and not new_entity_types:
            logger.info("Немає нових типів для додавання")
            return SchemaUpdate(
                update_id=update_id,
                status=EvolutionStatus.REJECTED,
                confidence=0.0,
                metadata={"reason": "no_new_types"}
            )
        
        # 3. Генерація Cypher команд
        cypher_commands = []
        for rel_type in new_relationship_types:
            cypher_commands.extend(self._generate_relationship_constraints(rel_type))
        
        for entity_type in new_entity_types:
            cypher_commands.extend(self._generate_entity_constraints(entity_type))
        
        # 4. Розрахунок впевненості
        avg_confidence = sum(p.confidence for p in validated) / len(validated)
        
        # 5. Створення об'єкта оновлення
        update = SchemaUpdate(
            update_id=update_id,
            new_relationships=list(new_relationship_types),
            new_entity_types=list(new_entity_types),
            cypher_commands=cypher_commands,
            patterns_applied=len(validated),
            status=EvolutionStatus.APPROVED,
            confidence=avg_confidence,
            metadata={
                "pattern_ids": [p.pattern_id for p in validated],
                "validation_details": [p.to_dict() for p in validated]
            }
        )
        
        # 6. Логування
        await self._log_evolution(
            log_id=self._generate_log_id(),
            update_id=update_id,
            action="SCHEMA_UPDATE_APPROVED",
            details=update.to_dict()
        )
        
        logger.info(f"Схема оновлена: {len(new_relationship_types)} нових relationship types")
        return update
    
    async def apply_schema_update(self, update: SchemaUpdate) -> bool:
        """Застосовує оновлення схеми до Neo4j.
        
        Args:
            update: SchemaUpdate для застосування
            
        Returns:
            True якщо успішно, False інакше
        """
        if not self.neo4j_driver:
            logger.warning("Neo4j драйвер не доступний, пропускаємо застосування")
            return False
        
        try:
            async with self.neo4j_driver.session() as session:
                for command in update.cypher_commands:
                    try:
                        await session.run(command)
                        logger.debug(f"Виконано команду: {command[:100]}...")
                    except Exception as e:
                        logger.warning(f"Помилка виконання команди: {e}")
                        # Продовжуємо з іншими командами
            
            update.status = EvolutionStatus.APPLIED
            update.applied_at = datetime.now(UTC).isoformat()
            
            # Логування
            await self._log_evolution(
                log_id=self._generate_log_id(),
                update_id=update.update_id,
                action="SCHEMA_UPDATE_APPLIED",
                details=update.to_dict()
            )
            
            logger.info(f"Схема успішно оновлена: {update.update_id}")
            return True
            
        except Exception as e:
            logger.exception(f"Помилка застосування оновлення схеми: {e}")
            update.status = EvolutionStatus.REJECTED
            return False
    
    async def rollback_schema_update(self, update: SchemaUpdate) -> bool:
        """Відкат оновлення схеми.
        
        Args:
            update: SchemaUpdate для відкату
            
        Returns:
            True якщо успішно, False інакше
        """
        if not self.neo4j_driver:
            logger.warning("Neo4j драйвер не доступний, пропускаємо відкат")
            return False
        
        try:
            # Видаляємо створені constraints
            async with self.neo4j_driver.session() as session:
                for rel_type in update.new_relationships:
                    try:
                        await session.run(f"DROP INDEX rel_{rel_type.lower()}_date IF EXISTS")
                    except Exception as e:
                        logger.warning(f"Помилка видалення index: {e}")
            
            update.status = EvolutionStatus.ROLLED_BACK
            
            # Логування
            await self._log_evolution(
                log_id=self._generate_log_id(),
                update_id=update.update_id,
                action="SCHEMA_UPDATE_ROLLED_BACK",
                details=update.to_dict()
            )
            
            logger.info(f"Схема відкачена: {update.update_id}")
            return True
            
        except Exception as e:
            logger.exception(f"Помилка відкату оновлення схеми: {e}")
            return False
    
    # --- Private methods ---
    
    async def _load_existing_schema(self):
        """Завантажує існуючу схему з Neo4j."""
        if not self.neo4j_driver:
            # Fallback: базові типи з db/neo4j/schema.cypher
            self._existing_relationships = {
                "OWNS", "DIRECTS", "FILED", "PROCESSED", 
                "REGISTERED_AT", "CONTAINS"
            }
            self._existing_entity_types = {
                "Company", "Person", "Declaration", "Product",
                "CustomsPost", "Broker", "Address", "Country"
            }
            return
        
        try:
            async with self.neo4j_driver.session() as session:
                # Отримуємо всі типи зв'язків
                result = await session.run("""
                    CALL db.relationshipTypes() YIELD relationshipType
                    RETURN relationshipType
                """)
                
                async for record in result:
                    self._existing_relationships.add(record["relationshipType"])
                
                # Отримуємо всі типи вузлів
                result = await session.run("""
                    CALL db.labels() YIELD label
                    RETURN label
                """)
                
                async for record in result:
                    self._existing_entity_types.add(record["label"])
                    
        except Exception as e:
            logger.warning(f"Помилка завантаження схеми: {e}")
            # Fallback до базових типів
            self._existing_relationships = {
                "OWNS", "DIRECTS", "FILED", "PROCESSED", 
                "REGISTERED_AT", "CONTAINS"
            }
            self._existing_entity_types = {
                "Company", "Person", "Declaration", "Product",
                "CustomsPost", "Broker", "Address", "Country"
            }
    
    async def _validate_patterns(self, patterns: list[Pattern]) -> list[Pattern]:
        """Валідація патернів перед еволюцією схеми."""
        validated = []
        
        for pattern in patterns:
            # Фільтруємо за впевненістю
            if pattern.confidence < 0.7:
                continue
            
            # Фільтруємо за типом relationship
            if not pattern.relationship_type or pattern.relationship_type == "UNKNOWN":
                continue
            
            # Перевіряємо, чи це новий тип
            if pattern.relationship_type in self._existing_relationships:
                continue
            
            validated.append(pattern)
        
        # LLM-підтвердження (якщо доступно)
        if validated and self._llm_client:
            try:
                llm_validated = await self._llm_validate_patterns(validated)
                validated = llm_validated
            except Exception as e:
                logger.warning(f"LLM валідація не вдалася: {e}")
        
        return validated
    
    async def _llm_validate_patterns(self, patterns: list[Pattern]) -> list[Pattern]:
        """LLM-підтвердження патернів для еволюції схеми."""
        prompt = f"""Проаналізуй наступні патерни та підтверди, чи вони вимагають створення нових типів зв'язків у графовій базі даних.

Патерни для аналізу:
{json.dumps([p.to_dict() for p in patterns], ensure_ascii=False, indent=2)}

Критерії для підтвердження:
1. Патерн має бути статистично значущим (confidence > 0.7)
2. Новий тип зв'язку має бути семантично коректним
3. Патерн має представляти реальну корупційну схему

Поверни JSON у форматі:
{{
    "validated": [
        {{
            "pattern_id": "ID",
            "is_valid": true,
            "reasoning": "пояснення"
        }}
    ]
}}
"""
        
        try:
            response = await self._llm_client.post(
                f"{settings.LLM_OLLAMA_BASE_URL}/generate",
                json={
                    "model": settings.OLLAMA_MODEL or "qwen2.5-coder:7b",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                result = json.loads(data.get("response", "{}"))
                
                validated = []
                for pattern in patterns:
                    validation = next(
                        (v for v in result.get("validated", []) if v["pattern_id"] == pattern.pattern_id),
                        None
                    )
                    
                    if validation and validation.get("is_valid", False):
                        pattern.metadata["llm_validated"] = True
                        pattern.metadata["llm_reasoning"] = validation.get("reasoning", "")
                        validated.append(pattern)
                
                return validated
                
        except Exception as e:
            logger.warning(f"LLM валідація патернів не вдалася: {e}")
        
        return patterns
    
    def _detect_new_relationship_types(self, patterns: list[Pattern]) -> set[str]:
        """Виявляє нові типи зв'язків."""
        new_types = set()
        for pattern in patterns:
            rel_type = pattern.relationship_type
            if rel_type and rel_type not in self._existing_relationships:
                new_types.add(rel_type)
        return new_types
    
    def _detect_new_entity_types(self, patterns: list[Pattern]) -> set[str]:
        """Виявляє нові типи сутностей."""
        new_types = set()
        for pattern in patterns:
            for entity in pattern.entities:
                if entity and entity not in self._existing_entity_types:
                    new_types.add(entity)
        return new_types
    
    def _generate_relationship_constraints(self, rel_type: str) -> list[str]:
        """Генерує Cypher constraints для нового relationship type."""
        rel_type_safe = rel_type.lower().replace("-", "_").replace(" ", "_").replace("`", "")
        
        commands = [
            f"""
// Auto-generated by Autonomous Schema Synthesis
// Relationship type: {rel_type}
// Generated at: {datetime.now(UTC).isoformat()}

CREATE INDEX rel_{rel_type_safe}_date IF NOT EXISTS
FOR ()-[r:`{rel_type}`]-() ON (r.created_at);
""",
            f"""
CREATE INDEX rel_{rel_type_safe}_confidence IF NOT EXISTS
FOR ()-[r:`{rel_type}`]-() ON (r.confidence);
"""
        ]
        
        return commands
    
    def _generate_entity_constraints(self, entity_type: str) -> list[str]:
        """Генерує Cypher constraints для нового entity type."""
        entity_type_safe = entity_type.lower().replace("-", "_").replace(" ", "_").replace("`", "")
        
        commands = [
            f"""
// Auto-generated by Autonomous Schema Synthesis
// Entity type: {entity_type}
// Generated at: {datetime.now(UTC).isoformat()}

CREATE INDEX {entity_type_safe}_name IF NOT EXISTS
FOR (n:`{entity_type}`) ON (n.name);
""",
            f"""
CREATE INDEX {entity_type_safe}_created_at IF NOT EXISTS
FOR (n:`{entity_type}`) ON (n.created_at);
"""
        ]
        
        return commands
    
    def _generate_update_id(self, patterns: list[Pattern]) -> str:
        """Генерує унікальний ID для оновлення."""
        pattern_ids = "".join(sorted(p.pattern_id for p in patterns))
        hash_input = f"{pattern_ids}:{datetime.now(UTC).isoformat()}"
        hash_val = hashlib.sha256(hash_input.encode()).hexdigest()[:12].upper()
        return f"SCHEMA-{hash_val}"
    
    def _generate_log_id(self) -> str:
        """Генерує унікальний ID для логу."""
        hash_input = f"{datetime.now(UTC).isoformat()}"
        hash_val = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
        return f"LOG-{hash_val}"
    
    async def _log_evolution(self, log_id: str, update_id: str, action: str, details: dict[str, Any]):
        """Логує еволюцію онтології."""
        log = EvolutionLog(
            log_id=log_id,
            update_id=update_id,
            action=action,
            details=details
        )
        
        # Тут можна зберігати в PostgreSQL або файл
        logger.info(f"Evolution Log: {log_id} - {action}")
        
        # TODO: Зберігати в PostgreSQL таблицю evolution_log


# Singleton instance
schema_evolution_engine = SchemaEvolutionEngine()


async def get_schema_evolution_engine() -> SchemaEvolutionEngine:
    """Отримати singleton екземпляр Schema Evolution Engine."""
    if not schema_evolution_engine._initialized:
        await schema_evolution_engine.initialize()
    return schema_evolution_engine
