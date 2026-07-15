"""NLP Pipeline для Autonomous Schema Synthesis (ASS).

PREDATOR Analytics v61.0-ELITE
Кіллер-фіча #1: Асиметрична перевага над Palantir Foundry

Цей модуль відповідає за:
1. Виділення сутностей з сирих текстів (spaCy + Ollama)
2. Виявлення зв'язків між сутностями (LLM)
3. Підтвердження нових типів сутностей (LLM validation)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
import json
import logging
from typing import Any

from app.config import settings

logger = logging.getLogger("predator.ingestion.nlp")


class EntityType(Enum):
    """Типи сутностей для PREDATOR Analytics."""

    COMPANY = "COMPANY"
    PERSON = "PERSON"
    GOVERNMENT = "GOVERNMENT"
    PRODUCT = "PRODUCT"
    ADDRESS = "ADDRESS"
    BANK_ACCOUNT = "BANK_ACCOUNT"
    CUSTOMS_POST = "CUSTOMS_POST"
    BROKER = "BROKER"
    UNKNOWN = "UNKNOWN"


class RelationshipType(Enum):
    """Типи зв'язків між сутностями."""

    OWNS = "OWNS"
    DIRECTS = "DIRECTS"
    FILED = "FILED"
    PROCESSED = "PROCESSED"
    REGISTERED_AT = "REGISTERED_AT"
    CONTAINS = "CONTAINS"

    # Автогенеровані типи (Autonomous Schema Synthesis)
    MUTUAL_BENEFICIARY = "MUTUAL_BENEFICIARY"
    MONEY_LAUNDERING_PATH = "MONEY_LAUNDERING_PATH"
    SHELL_COMPANY_CLUSTER = "SHELL_COMPANY_CLUSTER"
    CORRUPTION_RING = "CORRUPTION_RING"
    UNKNOWN = "UNKNOWN"


@dataclass
class Entity:
    """Сутність, виділена з тексту."""

    text: str
    entity_type: EntityType
    confidence: float = 0.8
    start_pos: int = 0
    end_pos: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "text": self.text,
            "entity_type": self.entity_type.value,
            "confidence": self.confidence,
            "start_pos": self.start_pos,
            "end_pos": self.end_pos,
            "metadata": self.metadata,
        }


@dataclass
class Relationship:
    """Зв'язок між сутностями."""

    source: str
    target: str
    relationship_type: RelationshipType
    confidence: float = 0.8
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "source": self.source,
            "target": self.target,
            "relationship_type": self.relationship_type.value,
            "confidence": self.confidence,
            "metadata": self.metadata,
        }


@dataclass
class NLPResult:
    """Результат NLP аналізу."""

    entities: list[Entity] = field(default_factory=list)
    relationships: list[Relationship] = field(default_factory=list)
    text: str = ""
    processing_time_ms: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "entities": [e.to_dict() for e in self.entities],
            "relationships": [r.to_dict() for r in self.relationships],
            "text": self.text,
            "processing_time_ms": self.processing_time_ms,
            "timestamp": self.timestamp,
        }


class NLPPipeline:
    """NLP Pipeline для Autonomous Schema Synthesis.
    
    Використовує spaCy для базового NER та Ollama для LLM-підтвердження
    нових типів сутностей та зв'язків.
    """

    def __init__(self):
        self._spacy_model = None
        self._llm_client = None
        self._initialized = False

    async def initialize(self):
        """Ініціалізація NLP Pipeline."""
        if self._initialized:
            return

        try:
            # Спроба завантажити spaCy модель
            try:
                import spacy
                self._spacy_model = spacy.load("uk_core_news_sm")
                logger.info("spaCy модель завантажено: uk_core_news_sm")
            except Exception as e:
                logger.warning(f"Не вдалося завантажити spaCy модель: {e}")
                logger.info("Використовуємо fallback без spaCy")

            # Ініціалізація LLM клієнта (Ollama)
            try:
                import httpx
                self._llm_client = httpx.AsyncClient(timeout=120.0)
                logger.info("LLM клієнт ініціалізовано (Ollama)")
            except Exception as e:
                logger.warning(f"Не вдалося ініціалізувати LLM клієнт: {e}")

            self._initialized = True
            logger.info("NLP Pipeline ініціалізовано")

        except Exception as e:
            logger.exception(f"Помилка ініціалізації NLP Pipeline: {e}")
            # Не падаємо, працюємо в fallback режимі
            self._initialized = True

    async def extract_entities(self, text: str) -> list[Entity]:
        """Виділяє сутності з тексту.
        
        Args:
            text: Вхідний текст
            
        Returns:
            Список виділених сутностей

        """
        if not text or not text.strip():
            return []

        entities = []

        # 1. spaCy NER (якщо доступно)
        if self._spacy_model:
            try:
                doc = self._spacy_model(text)
                for ent in doc.ents:
                    entity_type = self._map_spacy_label(ent.label_)
                    entities.append(Entity(
                        text=ent.text,
                        entity_type=entity_type,
                        confidence=0.8,
                        start_pos=ent.start_char,
                        end_pos=ent.end_char,
                        metadata={"source": "spacy", "spacy_label": ent.label_}
                    ))
            except Exception as e:
                logger.warning(f"spaCy NER помилка: {e}")

        # 2. LLM-підтвердження для невизначених сутностей
        unknown_entities = [e for e in entities if e.entity_type == EntityType.UNKNOWN]
        if unknown_entities and self._llm_client:
            try:
                confirmed = await self._llm_confirm_entities(unknown_entities, text)
                # Оновлюємо типи підтверджених сутностей
                for orig, conf in zip(unknown_entities, confirmed):
                    if conf.entity_type != EntityType.UNKNOWN:
                        orig.entity_type = conf.entity_type
                        orig.confidence = conf.confidence
                        orig.metadata["llm_confirmed"] = True
            except Exception as e:
                logger.warning(f"LLM підтвердження сутностей не вдалося: {e}")

        # 3. Fallback: простий regex для компаній та осіб
        if not entities:
            entities = self._regex_entity_extraction(text)

        return entities

    async def detect_relationships(
        self,
        entities: list[Entity],
        text: str
    ) -> list[Relationship]:
        """Виявляє зв'язки між сутностями.
        
        Args:
            entities: Список сутностей
            text: Вхідний текст
            
        Returns:
            Список виявлених зв'язків

        """
        if not entities or len(entities) < 2:
            return []

        relationships = []

        # 1. LLM-аналіз контексту для виявлення зв'язків
        if self._llm_client:
            try:
                llm_relationships = await self._llm_detect_relationships(entities, text)
                relationships.extend(llm_relationships)
            except Exception as e:
                logger.warning(f"LLM виявлення зв'язків не вдалося: {e}")

        # 2. Fallback: прості правила на основі ключових слів
        if not relationships:
            relationships = self._rule_based_relationship_detection(entities, text)

        return relationships

    async def process(self, text: str) -> NLPResult:
        """Повний цикл обробки тексту.
        
        Args:
            text: Вхідний текст
            
        Returns:
            NLPResult з сутностями та зв'язками

        """
        import time
        start_time = time.time()

        # Ініціалізація (якщо потрібно)
        if not self._initialized:
            await self.initialize()

        # Виділення сутностей
        entities = await self.extract_entities(text)

        # Виявлення зв'язків
        relationships = await self.detect_relationships(entities, text)

        processing_time = (time.time() - start_time) * 1000

        return NLPResult(
            entities=entities,
            relationships=relationships,
            text=text,
            processing_time_ms=processing_time,
        )

    # --- Private methods ---

    def _map_spacy_label(self, spacy_label: str) -> EntityType:
        """Мапінг spaCy labels на PREDATOR EntityTypes."""
        label_map = {
            "ORG": EntityType.COMPANY,
            "PERSON": EntityType.PERSON,
            "GPE": EntityType.GOVERNMENT,
            "LOC": EntityType.ADDRESS,
            "PRODUCT": EntityType.PRODUCT,
        }
        return label_map.get(spacy_label, EntityType.UNKNOWN)

    async def _llm_confirm_entities(
        self,
        entities: list[Entity],
        text: str
    ) -> list[Entity]:
        """LLM-підтвердження типів сутностей."""
        if not self._llm_client:
            return entities

        prompt = f"""Аналізуй наступні сутності з тексту та визнач їх точні типи.

Текст: {text[:2000]}

Сутності для аналізу:
{json.dumps([e.to_dict() for e in entities], ensure_ascii=False, indent=2)}

Можливі типи сутностей:
- COMPANY: компанія, підприємство, фірма
- PERSON: фізична особа, ПІБ
- GOVERNMENT: державний орган, установа
- PRODUCT: товар, послуга
- ADDRESS: адреса
- BANK_ACCOUNT: банківський рахунок
- CUSTOMS_POST: митний пост
- BROKER: митний брокер

Поверни JSON у форматі:
{{
    "entities": [
        {{
            "text": "текст сутності",
            "entity_type": "COMPANY",
            "confidence": 0.95
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

                confirmed = []
                for orig, conf in zip(entities, result.get("entities", [])):
                    entity_type = EntityType(conf.get("entity_type", "UNKNOWN"))
                    confirmed.append(Entity(
                        text=orig.text,
                        entity_type=entity_type,
                        confidence=conf.get("confidence", 0.7),
                        start_pos=orig.start_pos,
                        end_pos=orig.end_pos,
                        metadata={"source": "llm_confirmed"}
                    ))

                return confirmed

        except Exception as e:
            logger.warning(f"LLM підтвердження сутностей помилка: {e}")

        return entities

    async def _llm_detect_relationships(
        self,
        entities: list[Entity],
        text: str
    ) -> list[Relationship]:
        """LLM-виявлення зв'язків між сутностями."""
        if not self._llm_client or len(entities) < 2:
            return []

        entity_texts = [e.text for e in entities]

        prompt = f"""Аналізуй текст та вияв зв'язки між наступними сутностями:

Текст: {text[:2000]}

Сутності:
{json.dumps(entity_texts, ensure_ascii=False, indent=2)}

Можливі типи зв'язків:
- OWNS: володіє (компанія/особа володіє компанією)
- DIRECTS: керує (особа директорує компанією)
- FILED: подала (компанія подала декларацію)
- PROCESSED: обробила (брокер обробив декларацію)
- REGISTERED_AT: зареєстрована за (компанія за адресою)
- CONTAINS: містить (декларація містить товар)
- MUTUAL_BENEFICIARY: спільний бенефіціар (корупційна схема)
- MONEY_LAUNDERING_PATH: шлях відмивання грошей
- SHELL_COMPANY_CLUSTER: кластер компаній-пустушок
- CORRUPTION_RING: корупційне кільце

Поверни JSON у форматі:
{{
    "relationships": [
        {{
            "source": "текст сутності-джерела",
            "target": "текст сутності-цілі",
            "relationship_type": "OWNS",
            "confidence": 0.9
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

                relationships = []
                for rel in result.get("relationships", []):
                    rel_type = RelationshipType(rel.get("relationship_type", "UNKNOWN"))
                    relationships.append(Relationship(
                        source=rel.get("source", ""),
                        target=rel.get("target", ""),
                        relationship_type=rel_type,
                        confidence=rel.get("confidence", 0.7),
                        metadata={"source": "llm_detected"}
                    ))

                return relationships

        except Exception as e:
            logger.warning(f"LLM виявлення зв'язків помилка: {e}")

        return []

    def _regex_entity_extraction(self, text: str) -> list[Entity]:
        """Fallback: regex-виділення сутностей."""
        import re

        entities = []

        # Компанії (ТОВ, ПП, ПАТ, тощо)
        company_patterns = [
            r'(?:ТОВ|ПП|ПАТ|ПрАТ|АТ|ДП|КП)\s+["«]?([^"»»]+)["»»]?',
            r'(?:ТОВ|ПП|ПАТ|ПрАТ|АТ|ДП|КП)\s+([А-ЯІЇЄҐ][а-яіїєґ\s]+)',
        ]

        for pattern in company_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                company_name = match.group(1).strip()
                entities.append(Entity(
                    text=company_name,
                    entity_type=EntityType.COMPANY,
                    confidence=0.6,
                    metadata={"source": "regex"}
                ))

        # Особи (ПІБ)
        person_pattern = r'([А-ЯІЇЄҐ][а-яіїєґ]+\s+[А-ЯІЇЄҐ][а-яіїєґ]+(?:\s+[А-ЯІЇЄҐ][а-яіїєґ]+)?)'
        matches = re.finditer(person_pattern, text)
        for match in matches:
            person_name = match.group(1).strip()
            entities.append(Entity(
                text=person_name,
                entity_type=EntityType.PERSON,
                confidence=0.6,
                metadata={"source": "regex"}
            ))

        return entities

    def _rule_based_relationship_detection(
        self,
        entities: list[Entity],
        text: str
    ) -> list[Relationship]:
        """Fallback: rule-based виявлення зв'язків."""
        relationships = []

        # Прості правила на основі ключових слів
        text_lower = text.lower()

        for i, e1 in enumerate(entities):
            for e2 in entities[i+1:]:
                # OWNS: "володіє", "власник"
                if any(word in text_lower for word in ["володіє", "власник", "акціонер"]):
                    if e1.entity_type == EntityType.PERSON and e2.entity_type == EntityType.COMPANY:
                        relationships.append(Relationship(
                            source=e1.text,
                            target=e2.text,
                            relationship_type=RelationshipType.OWNS,
                            confidence=0.5,
                            metadata={"source": "rule_based"}
                        ))

                # DIRECTS: "директор", "керує"
                if any(word in text_lower for word in ["директор", "керує", "голова"]):
                    if e1.entity_type == EntityType.PERSON and e2.entity_type == EntityType.COMPANY:
                        relationships.append(Relationship(
                            source=e1.text,
                            target=e2.text,
                            relationship_type=RelationshipType.DIRECTS,
                            confidence=0.5,
                            metadata={"source": "rule_based"}
                        ))

        return relationships


# Singleton instance
nlp_pipeline = NLPPipeline()


async def get_nlp_pipeline() -> NLPPipeline:
    """Отримати singleton екземпляр NLP Pipeline."""
    if not nlp_pipeline._initialized:
        await nlp_pipeline.initialize()
    return nlp_pipeline
