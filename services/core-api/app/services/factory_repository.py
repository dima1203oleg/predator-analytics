"""
PREDATOR Factory Repository — Neo4j операції
Персистентність паттернів у GraphDB
"""

from neo4j import AsyncGraphDatabase
from app.models.factory import Pattern, PipelineResult, FactoryStats
from datetime import datetime, UTC
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


class FactoryRepository:
    """Репозиторій для операцій з Factory паттернами в Neo4j"""

    def __init__(self, neo4j_driver):
        self.driver = neo4j_driver

    async def save_pattern(self, pattern: Pattern) -> str:
        """Зберегти патерн у Neo4j. Повертає ID."""
        async with self.driver.session() as session:
            result = await session.run(
                """
                CREATE (p:Pattern {
                    component: $component,
                    description: $description,
                    pattern_type: $pattern_type,
                    score: $score,
                    gold: $gold,
                    timestamp: datetime($timestamp),
                    hash: $hash,
                    tags: $tags,
                    source_run_id: $source_run_id
                })
                RETURN elementId(p) as id
                """,
                component=pattern.component.value,
                description=pattern.pattern_description,
                pattern_type=pattern.pattern_type.value,
                score=pattern.score,
                gold=pattern.gold,
                timestamp=pattern.timestamp.isoformat(),
                hash=pattern.hash,
                tags=pattern.tags,
                source_run_id=pattern.source_run_id,
            )
            record = await result.single()
            pattern_id = record["id"] if record else None
            logger.info(f"Pattern saved: {pattern.hash} (id: {pattern_id})")
            return pattern_id

    async def get_pattern_by_hash(self, hash_value: str) -> Optional[Pattern]:
        """Отримати патерн за хешем"""
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH (p:Pattern {hash: $hash})
                RETURN p
                """,
                hash=hash_value,
            )
            record = await result.single()
            if not record:
                return None

            p = record["p"]
            return Pattern(
                id=str(p.id),
                component=p["component"],
                pattern_description=p["description"],
                pattern_type=p["pattern_type"],
                score=p["score"],
                gold=p["gold"],
                timestamp=datetime.fromisoformat(p["timestamp"]),
                hash=p["hash"],
                tags=p.get("tags", []),
                source_run_id=p["source_run_id"],
            )

    async def get_gold_patterns(self, component: Optional[str] = None) -> List[Pattern]:
        """Отримати Gold Patterns"""
        async with self.driver.session() as session:
            query = "MATCH (p:Pattern {gold: true})"
            if component:
                query += " WHERE p.component = $component"
            query += " RETURN p ORDER BY p.score DESC LIMIT 50"

            result = await session.run(
                query,
                component=component if component else None,
            )
            records = await result.fetch(50)

            patterns = []
            for record in records:
                p = record["p"]
                patterns.append(
                    Pattern(
                        id=str(p.id),
                        component=p["component"],
                        pattern_description=p["description"],
                        pattern_type=p["pattern_type"],
                        score=p["score"],
                        gold=p["gold"],
                        timestamp=datetime.fromisoformat(p["timestamp"]),
                        hash=p["hash"],
                        tags=p.get("tags", []),
                        source_run_id=p["source_run_id"],
                    )
                )
            return patterns

    async def get_stats(self) -> FactoryStats:
        """Отримати статистику Factory"""
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH (p:Pattern)
                RETURN 
                    COUNT(p) as total_patterns,
                    SUM(CASE WHEN p.gold THEN 1 ELSE 0 END) as gold_patterns,
                    AVG(p.score) as avg_score,
                    MAX(p.timestamp) as last_run
                """
            )
            record = await result.single()

            stats = FactoryStats(
                total_patterns=record["total_patterns"] or 0,
                gold_patterns=record["gold_patterns"] or 0,
                avg_score=round(record["avg_score"] or 0, 2),
                last_run=(
                    datetime.fromisoformat(record["last_run"])
                    if record["last_run"]
                    else None
                ),
            )
            return stats

    async def save_run(self, pipeline_result: PipelineResult) -> None:
        """Зберегти результат пайплайну для аудиту"""
        async with self.driver.session() as session:
            await session.run(
                """
                CREATE (r:Run {
                    run_id: $run_id,
                    component: $component,
                    score: $score,
                    timestamp: datetime($timestamp),
                    branch: $branch,
                    commit_sha: $commit_sha
                })
                """,
                run_id=pipeline_result.run_id,
                component=pipeline_result.component.value,
                score=pipeline_result.metrics.average(),
                timestamp=pipeline_result.timestamp.isoformat(),
                branch=pipeline_result.branch,
                commit_sha=pipeline_result.commit_sha,
            )
