"""PREDATOR Factory Repository — Neo4j операції
Персистентність паттернів у GraphDB
"""

from datetime import UTC, datetime
import logging

from app.models.factory import (
    Bug,
    BugStatus,
    FactoryStats,
    Pattern,
    PipelineResult,
    SystemImprovement,
)

logger = logging.getLogger(__name__)


class FactoryRepository:
    """Репозиторій для операцій з Factory паттернами в Neo4j"""

    def __init__(self, neo4j_driver):
        self.driver = neo4j_driver

    async def save_pattern(self, pattern: Pattern) -> str:
        """Зберегти патерн у Neo4j. Повертає ID."""
        try:
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
                pattern_id = record["id"] if record else "ERR_NO_RECORD"
                logger.info(f"Pattern saved: {pattern.hash} (id: {pattern_id})")
                return str(pattern_id)
        except Exception as e:
            logger.error(f"Failed to save pattern: {e}")
            return "ERR_OFFLINE"

    async def get_pattern_by_hash(self, hash_value: str) -> Pattern | None:
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

    async def get_gold_patterns(self, component: str | None = None) -> list[Pattern]:
        """Отримати Gold Patterns"""
        try:
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
        except Exception as e:
            logger.warning(f"Neo4j get_gold_patterns failed: {e}")
            return []

    async def get_stats(self) -> FactoryStats:
        """Отримати статистику Factory"""
        try:
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

                if not record:
                    return FactoryStats(total_patterns=0, gold_patterns=0, avg_score=0.0)

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
        except Exception as e:
            logger.warning(f"Neo4j get_stats failed: {e}")
            return FactoryStats(total_patterns=0, gold_patterns=0, avg_score=0.0)

    async def save_run(self, pipeline_result: PipelineResult) -> None:
        """Зберегти результат пайплайну для аудиту"""
        try:
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
        except Exception as e:
            logger.error(f"Failed to save run: {e}")

    async def save_bug(self, bug: Bug) -> str:
        """Зберегти баг у Neo4j"""
        try:
            async with self.driver.session() as session:
                result = await session.run(
                    """
                    MERGE (b:Bug {id: $id})
                    SET b += {
                        id: $id,
                        description: $description,
                        severity: $severity,
                        component: $component,
                        file: $file,
                        status: $status,
                        fix_progress: $fix_progress,
                        detected_at: datetime($detected_at)
                    }
                    RETURN elementId(b) as id
                    """,
                    id=bug.id,
                    description=bug.description,
                    severity=bug.severity.value,
                    component=bug.component.value,
                    file=bug.file,
                    status=bug.status.value,
                    fix_progress=bug.fix_progress,
                    detected_at=bug.detected_at.isoformat(),
                )
                record = await result.single()
                return str(record["id"]) if record else bug.id
        except Exception as e:
            logger.error(f"Failed to save bug: {e}")
            return bug.id

    async def get_bugs(self) -> list[Bug]:
        """Отримати всі активні баги"""
        try:
            async with self.driver.session() as session:
                result = await session.run(
                    "MATCH (b:Bug) WHERE b.status <> 'fixed' RETURN b ORDER BY b.detected_at DESC"
                )
                records = await result.fetch(100)
                return [
                    Bug(
                        id=record["b"]["id"],
                        description=record["b"]["description"],
                        severity=record["b"]["severity"],
                        component=record["b"]["component"],
                        file=record["b"]["file"],
                        status=record["b"]["status"],
                        fix_progress=record["b"]["fix_progress"],
                        detected_at=datetime.fromisoformat(str(record["b"]["detected_at"])) if isinstance(record["b"]["detected_at"], str) else record["b"]["detected_at"],
                    )
                    for record in records
                ]
        except Exception as e:
            logger.warning(f"Neo4j get_bugs failed (possibly offline): {e}")
            return [
                Bug(
                    id="BUG-OFFLINE-1",
                    description="ВІДСУТНІЙ ЗВ'ЯЗОК З NEO4J. СЕРВЕР ПРАЦЮЄ В РЕЖИМІ ОЧІКУВАННЯ.",
                    severity="high",
                    component="graph-db",
                    file="core-api",
                    status="detected",
                    fix_progress=0
                )
            ]

    async def update_bug_status(self, bug_id: str, status: BugStatus, progress: int = 0) -> bool:
        """Оновити статус та прогрес виправлення бага"""
        try:
            async with self.driver.session() as session:
                await session.run(
                    """
                    MATCH (b:Bug {id: $id})
                    SET b.status = $status, b.fix_progress = $progress
                    SET b.fixed_at = CASE WHEN $status = 'fixed' THEN datetime() ELSE b.fixed_at END
                    """,
                    id=bug_id,
                    status=status.value,
                    progress=progress,
                )
                return True
        except Exception as e:
            logger.error(f"Failed to update bug status: {e}")
            return False

    async def get_improvement(self) -> SystemImprovement:
        """Отримати стан вдосконалення"""
        try:
            async with self.driver.session() as session:
                result = await session.run("MATCH (i:SystemImprovement) RETURN i LIMIT 1")
                record = await result.single()
                if not record:
                    return SystemImprovement()

                i = record["i"]
                return SystemImprovement(
                    is_running=i["is_running"],
                    current_phase=i["current_phase"],
                    cycles_completed=i["cycles_completed"],
                    improvements_made=i["improvements_made"],
                    logs=i.get("logs", []),
                    last_update=datetime.fromisoformat(str(i["last_update"]).replace("Z", "+00:00")),
                )
        except Exception as e:
            logger.warning(f"Neo4j get_improvement failed (possibly offline): {e}")
            return SystemImprovement(
                is_running=False,
                logs=[f"[{datetime.now(UTC).strftime('%H:%M:%S')}] ⚠️ DB OFFLINE: Не вдалося завантажити стан з Neo4j."]
            )

    async def update_improvement(self, imp: SystemImprovement) -> bool:
        """Оновити стан вдосконалення"""
        try:
            async with self.driver.session() as session:
                await session.run(
                    """
                    MERGE (i:SystemImprovement)
                    SET i += {
                        is_running: $is_running,
                        current_phase: $current_phase,
                        cycles_completed: $cycles_completed,
                        improvements_made: $improvements_made,
                        logs: $logs,
                        last_update: $last_update
                    }
                    """,
                    is_running=imp.is_running,
                    current_phase=imp.current_phase.value,
                    cycles_completed=imp.cycles_completed,
                    improvements_made=imp.improvements_made,
                    logs=imp.logs,
                    last_update=imp.last_update.isoformat(),
                )
                return True
        except Exception as e:
            logger.error(f"Failed to update improvement: {e}")
            return False

    async def add_factory_log(self, message: str, service: str, level: str) -> None:
        """Додати запис у лог вдосконалення"""
        try:
            async with self.driver.session() as session:
                await session.run(
                    """
                    MERGE (i:SystemImprovement)
                    SET i.logs = COALESCE(i.logs, []) + [$log]
                    SET i.last_update = datetime()
                    """,
                    log=f"[{datetime.now(UTC).strftime('%H:%M:%S')}] {level.upper()}({service}): {message}"
                )
        except Exception as e:
            logger.error(f"Failed to add factory log: {e}")
