"""Pattern Discovery Engine для Autonomous Schema Synthesis (ASS).

PREDATOR Analytics v61.0-ELITE
Кіллер-фіча #1: Асиметрична перевага над Palantir Foundry

Цей модуль відповідає за:
1. Виявлення нових патернів корупційних ланцюжків
2. Monte Carlo simulation для аналізу графу
3. Statistical anomaly detection
4. LLM validation нових патернів
"""

from __future__ import annotations

import asyncio
import json
import logging
import random
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

import orjson

from app.config import settings

logger = logging.getLogger("predator.ingestion.pattern_discovery")


class PatternType(Enum):
    """Типи патернів корупційних ланцюжків."""
    MUTUAL_BENEFICIARY = "MUTUAL_BENEFICIARY"
    MONEY_LAUNDERING = "MONEY_LAUNDERING"
    SHELL_COMPANY_CLUSTER = "SHELL_COMPANY_CLUSTER"
    CORRUPTION_RING = "CORRUPTION_RING"
    TRADE_BASED_MONEY_LAUNDERING = "TRADE_BASED_MONEY_LAUNDERING"
    ROUND_TRIPPING = "ROUND_TRIPPING"
    UNKNOWN = "UNKNOWN"


@dataclass
class Pattern:
    """Виявлений патерн."""
    pattern_id: str
    pattern_type: PatternType
    description: str
    relationship_type: str
    confidence: float
    entities: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    discovered_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    
    def to_dict(self) -> dict[str, Any]:
        return {
            "pattern_id": self.pattern_id,
            "pattern_type": self.pattern_type.value,
            "description": self.description,
            "relationship_type": self.relationship_type,
            "confidence": self.confidence,
            "entities": self.entities,
            "metadata": self.metadata,
            "discovered_at": self.discovered_at,
        }


@dataclass
class GraphSample:
    """Вибірка з графу для аналізу."""
    nodes: list[dict[str, Any]]
    relationships: list[dict[str, Any]]
    sample_size: int
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())


class PatternDiscoveryEngine:
    """Виявлення нових патернів у графі за допомогою Monte Carlo simulation.
    
    Алгоритм:
    1. Отримуємо підграф з Neo4j
    2. Monte Carlo simulation (100 ітерацій)
    3. Statistical anomaly detection
    4. LLM validation нових патернів
    """
    
    def __init__(self, neo4j_driver=None):
        self.neo4j_driver = neo4j_driver
        self._llm_client = None
        self._initialized = False
        
    async def initialize(self):
        """Ініціалізація Pattern Discovery Engine."""
        if self._initialized:
            return
        
        try:
            # Ініціалізація Neo4j клієнта
            if not self.neo4j_driver:
                try:
                    from neo4j import AsyncGraphDatabase
                    self.neo4j_driver = AsyncGraphDatabase.driver(
                        settings.NEO4J_URI,
                        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                    )
                    logger.info("Neo4j драйвер ініціалізовано для Pattern Discovery")
                except Exception as e:
                    logger.warning(f"Не вдалося ініціалізувати Neo4j драйвер: {e}")

            # Ініціалізація LLM клієнта (Ollama)
            try:
                import httpx
                self._llm_client = httpx.AsyncClient(timeout=120.0)
                logger.info("LLM клієнт ініціалізовано (Ollama)")
            except Exception as e:
                logger.warning(f"Не вдалося ініціалізувати LLM клієнт: {e}")
            
            self._initialized = True
            logger.info("Pattern Discovery Engine ініціалізовано")
            
        except Exception as e:
            logger.exception(f"Помилка ініціалізації Pattern Discovery Engine: {e}")
            self._initialized = True
    
    async def discover_new_patterns(
        self, 
        sample_size: int = 1000,
        monte_carlo_iterations: int = 100
    ) -> list[Pattern]:
        """Виявляє нові патерни за допомогою Monte Carlo simulation.
        
        Args:
            sample_size: Розмір вибірки з графу
            monte_carlo_iterations: Кількість ітерацій Monte Carlo
            
        Returns:
            Список виявлених патернів
        """
        if not self._initialized:
            await self.initialize()
        
        # 1. Отримуємо підграф
        subgraph = await self._sample_subgraph(sample_size)
        
        # 2. Monte Carlo simulation
        patterns = []
        for i in range(monte_carlo_iterations):
            simulated = self._simulate_graph(subgraph)
            new_patterns = self._detect_anomalies(simulated, iteration=i)
            patterns.extend(new_patterns)
        
        # 3. Агрегація та фільтрація
        aggregated = self._aggregate_patterns(patterns)
        
        # 4. LLM-підтвердження
        confirmed = await self._llm_validate_patterns(aggregated)
        
        logger.info(f"Виявлено {len(confirmed)} нових патернів")
        return confirmed
    
    async def _sample_subgraph(self, sample_size: int) -> GraphSample:
        """Отримує вибірку з графу Neo4j."""
        if not self.neo4j_driver:
            # Fallback: генеруємо синтетичні дані для тестування
            logger.warning("Neo4j драйвер не доступний, використовуємо синтетичні дані")
            return self._generate_synthetic_subgraph(sample_size)
        
        try:
            async with self.neo4j_driver.session() as session:
                # Отримуємо випадкові вузли та зв'язки
                result = await session.run("""
                    MATCH (n)
                    WITH n, rand() AS r
                    ORDER BY r
                    LIMIT $limit
                    MATCH (n)-[r]-(m)
                    RETURN n, r, m
                    LIMIT $limit * 2
                """, {"limit": sample_size})
                
                nodes = []
                relationships = []
                
                async for record in result:
                    nodes.append(dict(record["n"]))
                    relationships.append(dict(record["r"]))
                
                return GraphSample(
                    nodes=nodes,
                    relationships=relationships,
                    sample_size=sample_size
                )
                
        except Exception as e:
            logger.warning(f"Помилка отримання вибірки з Neo4j: {e}")
            return self._generate_synthetic_subgraph(sample_size)
    
    def _generate_synthetic_subgraph(self, sample_size: int) -> GraphSample:
        """Генерує синтетичні дані для тестування."""
        nodes = []
        relationships = []
        
        # Генеруємо компанії
        for i in range(sample_size // 2):
            nodes.append({
                "id": f"company_{i}",
                "name": f"Company {i}",
                "type": "COMPANY",
                "edrpou": f"{random.randint(10000000, 99999999)}"
            })
        
        # Генеруємо осіб
        for i in range(sample_size // 2):
            nodes.append({
                "id": f"person_{i}",
                "name": f"Person {i}",
                "type": "PERSON",
                "inn": f"{random.randint(100000000000, 999999999999)}"
            })
        
        # Генеруємо зв'язки
        for i in range(sample_size):
            source = random.choice(nodes)
            target = random.choice(nodes)
            rel_type = random.choice(["OWNS", "DIRECTS", "FILED"])
            relationships.append({
                "source": source["id"],
                "target": target["id"],
                "type": rel_type,
                "confidence": random.random()
            })
        
        return GraphSample(
            nodes=nodes,
            relationships=relationships,
            sample_size=sample_size
        )
    
    def _simulate_graph(self, graph: GraphSample) -> GraphSample:
        """Monte Carlo simulation: модифікує граф для виявлення патернів."""
        # Копіюємо граф
        simulated_nodes = graph.nodes.copy()
        simulated_relationships = graph.relationships.copy()
        
        # Додаємо шум та варіації
        if random.random() < 0.3:  # 30% шанс додати новий зв'язок
            source = random.choice(simulated_nodes)
            target = random.choice(simulated_nodes)
            simulated_relationships.append({
                "source": source["id"],
                "target": target["id"],
                "type": "MUTUAL_BENEFICIARY",  # Підозрілий зв'язок
                "confidence": random.random()
            })
        
        if random.random() < 0.2:  # 20% шанс видалити зв'язок
            if simulated_relationships:
                simulated_relationships.pop(random.randint(0, len(simulated_relationships) - 1))
        
        return GraphSample(
            nodes=simulated_nodes,
            relationships=simulated_relationships,
            sample_size=graph.sample_size
        )
    
    def _detect_anomalies(self, graph: GraphSample, iteration: int) -> list[Pattern]:
        """Виявляє аномалії в графі."""
        patterns = []
        
        # Аналіз зв'язків
        relationship_counts = {}
        for rel in graph.relationships:
            rel_type = rel.get("type", "UNKNOWN")
            relationship_counts[rel_type] = relationship_counts.get(rel_type, 0) + 1
        
        # Виявляємо рідкісні типи зв'язків (потенційно нові патерни)
        total_relationships = len(graph.relationships)
        for rel_type, count in relationship_counts.items():
            frequency = count / total_relationships if total_relationships > 0 else 0
            
            # Якщо частота < 5% — це може бути новий патерн
            if frequency < 0.05 and rel_type not in ["OWNS", "DIRECTS", "FILED", "PROCESSED"]:
                pattern_id = f"pattern_{iteration}_{rel_type}"
                patterns.append(Pattern(
                    pattern_id=pattern_id,
                    pattern_type=self._infer_pattern_type(rel_type),
                    description=f"Рідкісний тип зв'язку: {rel_type} (частота: {frequency:.2%})",
                    relationship_type=rel_type,
                    confidence=1.0 - frequency,  # Чим рідкіше, тим вище впевненість
                    metadata={
                        "frequency": frequency,
                        "count": count,
                        "iteration": iteration
                    }
                ))
        
        # Виявляємо кластери компаній (shell company clusters)
        company_clusters = self._detect_company_clusters(graph)
        for cluster in company_clusters:
            pattern_id = f"pattern_{iteration}_cluster_{cluster['cluster_id']}"
            patterns.append(Pattern(
                pattern_id=pattern_id,
                pattern_type=PatternType.SHELL_COMPANY_CLUSTER,
                description=f"Кластер з {cluster['size']} компаній зі схожими характеристиками",
                relationship_type="SHELL_COMPANY_CLUSTER",
                confidence=cluster.get("confidence", 0.7),
                entities=cluster.get("entities", []),
                metadata={
                    "cluster_id": cluster["cluster_id"],
                    "size": cluster["size"],
                    "iteration": iteration
                }
            ))
        
        return patterns
    
    def _infer_pattern_type(self, relationship_type: str) -> PatternType:
        """Виводить тип патерну з типу зв'язку."""
        if "MUTUAL" in relationship_type.upper():
            return PatternType.MUTUAL_BENEFICIARY
        elif "MONEY" in relationship_type.upper() or "LAUNDERING" in relationship_type.upper():
            return PatternType.MONEY_LAUNDERING
        elif "SHELL" in relationship_type.upper() or "CLUSTER" in relationship_type.upper():
            return PatternType.SHELL_COMPANY_CLUSTER
        elif "CORRUPTION" in relationship_type.upper() or "RING" in relationship_type.upper():
            return PatternType.CORRUPTION_RING
        else:
            return PatternType.UNKNOWN
    
    def _detect_company_clusters(self, graph: GraphSample) -> list[dict[str, Any]]:
        """Виявляє кластери компаній за схожими характеристиками."""
        clusters = []
        
        # Групуємо компанії за типом
        companies = [n for n in graph.nodes if n.get("type") == "COMPANY"]
        
        if len(companies) < 3:
            return clusters
        
        # Простий кластеризація: компанії з однаковими першими символами назви
        name_groups = {}
        for company in companies:
            name = company.get("name", "")
            if name:
                prefix = name[:3].upper()
                if prefix not in name_groups:
                    name_groups[prefix] = []
                name_groups[prefix].append(company)
        
        # Формуємо кластери
        for cluster_id, entities in name_groups.items():
            if len(entities) >= 3:  # Кластер з 3+ компаній
                clusters.append({
                    "cluster_id": cluster_id,
                    "size": len(entities),
                    "entities": [e.get("name", "") for e in entities],
                    "confidence": min(0.9, len(entities) / 10.0)
                })
        
        return clusters
    
    def _aggregate_patterns(self, patterns: list[Pattern]) -> list[Pattern]:
        """Агрегує схожі патерни з різних ітерацій."""
        # Групуємо за relationship_type
        pattern_groups = {}
        for pattern in patterns:
            rel_type = pattern.relationship_type
            if rel_type not in pattern_groups:
                pattern_groups[rel_type] = []
            pattern_groups[rel_type].append(pattern)
        
        # Агрегуємо кожну групу
        aggregated = []
        for rel_type, group in pattern_groups.items():
            if len(group) > 1:
                # Беремо патерн з найвищою впевненістю
                best = max(group, key=lambda p: p.confidence)
                best.metadata["occurrences"] = len(group)
                best.metadata["avg_confidence"] = sum(p.confidence for p in group) / len(group)
                aggregated.append(best)
            else:
                aggregated.append(group[0])
        
        # Сортуємо за впевненістю
        aggregated.sort(key=lambda p: p.confidence, reverse=True)
        
        return aggregated
    
    async def _llm_validate_patterns(self, patterns: list[Pattern]) -> list[Pattern]:
        """LLM-підтвердження нових патернів."""
        if not self._llm_client or not patterns:
            return patterns
        
        # Беремо топ-10 патернів для валідації
        top_patterns = patterns[:10]
        
        prompt = f"""Проаналізуй наступні патерни та підтверди, чи вони є реальними корупційними схемами.

Патерни для аналізу:
{json.dumps([p.to_dict() for p in top_patterns], ensure_ascii=False, indent=2)}

Можливі типи патернів:
- MUTUAL_BENEFICIARY: спільний бенефіціар (корупційна схема)
- MONEY_LAUNDERING: відмивання грошей
- SHELL_COMPANY_CLUSTER: кластер компаній-пустушок
- CORRUPTION_RING: корупційне кільце
- TRADE_BASED_MONEY_LAUNDERING: торгівельне відмивання грошей
- ROUND_TRIPPING: кругообіг коштів

Поверни JSON у форматі:
{{
    "confirmed": [
        {{
            "pattern_id": "ID",
            "is_valid": true,
            "confidence": 0.9,
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
                
                # Оновлюємо патерни з LLM підтвердженням
                confirmed_patterns = []
                for pattern in top_patterns:
                    validation = next(
                        (v for v in result.get("confirmed", []) if v["pattern_id"] == pattern.pattern_id),
                        None
                    )
                    
                    if validation and validation.get("is_valid", False):
                        pattern.confidence = validation.get("confidence", pattern.confidence)
                        pattern.metadata["llm_validated"] = True
                        pattern.metadata["llm_reasoning"] = validation.get("reasoning", "")
                        confirmed_patterns.append(pattern)
                
                # Додаємо непідтверджені патерни зниженою впевненістю
                for pattern in top_patterns:
                    if pattern not in confirmed_patterns:
                        pattern.confidence *= 0.5  # Знижуємо впевненість
                        pattern.metadata["llm_validated"] = False
                        confirmed_patterns.append(pattern)
                
                # Повертаємо всі патерни (включаючи ті, що не були валідовані)
                return patterns
                
        except Exception as e:
            logger.warning(f"LLM валідація патернів не вдалася: {e}")
        
        return patterns


# Singleton instance
pattern_discovery_engine = PatternDiscoveryEngine()


async def get_pattern_discovery_engine() -> PatternDiscoveryEngine:
    """Отримати singleton екземпляр Pattern Discovery Engine."""
    if not pattern_discovery_engine._initialized:
        await pattern_discovery_engine.initialize()
    return pattern_discovery_engine
