"""Smart Data Router — AI-маршрутизація запитів до оптимальної БД.

Політика роутингу (System Memory Contract, HR-17..HR-20):
- OLAP агрегації (>100k) → ClickHouse
- Multi-hop графи (depth>2) → Neo4j
- Fulltext + filters → OpenSearch
- Semantic / RAG → Qdrant
- Exact PK + транзакції → PostgreSQL
- Файли/скани → MinIO
- Hot cache (TTL<5хв) → Redis
- Event stream → Kafka
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Any

from predator_common.logging import get_logger

logger = get_logger("core_api.smart_data_router")


class DatabaseTarget(str, Enum):
    """Цільова БД для запиту."""

    POSTGRESQL = "postgresql"
    CLICKHOUSE = "clickhouse"
    NEO4J = "neo4j"
    OPENSEARCH = "opensearch"
    QDRANT = "qdrant"
    REDIS = "redis"
    MINIO = "minio"
    KAFKA = "kafka"


@dataclass
class RoutingDecision:
    """Результат класифікації запиту."""

    target: DatabaseTarget
    confidence: float  # 0.0–1.0
    reason: str
    fallback: DatabaseTarget | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "target": self.target.value,
            "confidence": round(self.confidence, 2),
            "reason": self.reason,
            "fallback": self.fallback.value if self.fallback else None,
        }


# Евристичні патерни (українська + англійська)
_AGGREGATION_KEYWORDS = {
    "sum", "count", "avg", "top", "найбільш", "тренд", "за період", "агрегація",
    "топ", "статистика", "аналітика", "звіт", "за рік", "за місяць", "розподіл",
    "group by", "histogram",
}
_GRAPH_KEYWORDS = {
    "зв'язок", "зв'язки", "мережа", "бенефіціар", "власник", "ланцюжок",
    "relationship", "ubo", "ownership", "граф", "вплив", "контроль", "схема",
}
_FULLTEXT_KEYWORDS = {
    "знайти", "шукати", "пошук", "містить", "декларація",
    "search", "find", "contains", "fulltext", "текст",
}
_SEMANTIC_KEYWORDS = {
    "схоже", "подібне", "найближче", "similar", "semantic", "rag", "контекст",
    "значення", "смисл",
}
_TRANSACTIONAL_KEYWORDS = {
    "create", "insert", "update", "delete", "створити", "оновити", "видалити",
    "транзакція", "commit", "rollback",
}
_FILE_KEYWORDS = {
    "файл", "скан", "pdf", "документ", "attachment", "blob", "file", "upload",
    "завантажити",
}


def _contains_any(text: str, keywords: set[str]) -> bool:
    """Чи містить текст будь-яке з ключових слів (case-insensitive)."""
    lower = text.lower()
    return any(kw in lower for kw in keywords)


def _estimate_row_scope(query: str) -> int:
    """Оцінка масштабу: шукаємо числа типу '100000 записів'."""
    match = re.search(r"(\d{4,})", query)
    if match:
        return int(match.group(1))
    return 0


class SmartDataRouter:
    """Маршрутизатор із евристиками + LLM-фолбек."""

    def __init__(self, llm_fallback_enabled: bool = False) -> None:
        self.llm_fallback_enabled = llm_fallback_enabled
        self._stats: dict[str, int] = {target.value: 0 for target in DatabaseTarget}
        self._total_decisions = 0
        self._fallback_count = 0

    def route(
        self,
        query: str,
        hint_depth: int | None = None,
        hint_rows: int | None = None,
        hint_mode: str | None = None,
    ) -> RoutingDecision:
        """Класифікувати запит → обрати БД.

        Параметри
        ---------
        query : природномовний опис наміру
        hint_depth : глибина графових хопів (для точного маршрутингу в Neo4j)
        hint_rows : очікувана кількість рядків
        hint_mode : 'transactional' | 'analytical' | 'search' | 'semantic' | 'file' | 'stream'
        """
        self._total_decisions += 1

        # 1. Явні хінти — найвищий пріоритет.
        if hint_mode == "stream":
            return self._decide(DatabaseTarget.KAFKA, 1.0, "hint_mode=stream")
        if hint_mode == "file":
            return self._decide(DatabaseTarget.MINIO, 1.0, "hint_mode=file")
        if hint_mode == "semantic":
            return self._decide(DatabaseTarget.QDRANT, 1.0, "hint_mode=semantic")
        if hint_mode == "search":
            return self._decide(DatabaseTarget.OPENSEARCH, 1.0, "hint_mode=search")
        if hint_mode == "transactional":
            return self._decide(DatabaseTarget.POSTGRESQL, 1.0, "hint_mode=transactional")

        if hint_depth is not None and hint_depth >= 2:
            return self._decide(
                DatabaseTarget.NEO4J, 0.95, f"graph depth={hint_depth}",
                fallback=DatabaseTarget.POSTGRESQL,
            )

        rows = hint_rows if hint_rows is not None else _estimate_row_scope(query)
        if rows >= 100_000:
            return self._decide(
                DatabaseTarget.CLICKHOUSE, 0.9, f"rows={rows} ≥ 100k (OLAP)",
                fallback=DatabaseTarget.POSTGRESQL,
            )

        # 2. Евристики на тексті.
        if _contains_any(query, _GRAPH_KEYWORDS):
            return self._decide(
                DatabaseTarget.NEO4J, 0.85, "graph keywords detected",
                fallback=DatabaseTarget.POSTGRESQL,
            )
        if _contains_any(query, _SEMANTIC_KEYWORDS):
            return self._decide(
                DatabaseTarget.QDRANT, 0.8, "semantic keywords detected",
                fallback=DatabaseTarget.OPENSEARCH,
            )
        if _contains_any(query, _AGGREGATION_KEYWORDS):
            return self._decide(
                DatabaseTarget.CLICKHOUSE, 0.8, "aggregation keywords detected",
                fallback=DatabaseTarget.POSTGRESQL,
            )
        if _contains_any(query, _FULLTEXT_KEYWORDS):
            return self._decide(
                DatabaseTarget.OPENSEARCH, 0.75, "fulltext keywords detected",
                fallback=DatabaseTarget.POSTGRESQL,
            )
        if _contains_any(query, _FILE_KEYWORDS):
            return self._decide(
                DatabaseTarget.MINIO, 0.8, "file/blob keywords detected",
            )
        if _contains_any(query, _TRANSACTIONAL_KEYWORDS):
            return self._decide(
                DatabaseTarget.POSTGRESQL, 0.85, "transactional keywords detected",
            )

        # 3. Фолбек — PostgreSQL SSOT.
        self._fallback_count += 1
        logger.info(
            "Smart router не знайшов чіткий маршрут",
            extra={"query_preview": query[:80]},
        )
        return self._decide(
            DatabaseTarget.POSTGRESQL, 0.4, "no clear signal → fallback to SSOT",
            fallback=DatabaseTarget.OPENSEARCH,
        )

    def _decide(
        self,
        target: DatabaseTarget,
        confidence: float,
        reason: str,
        fallback: DatabaseTarget | None = None,
    ) -> RoutingDecision:
        self._stats[target.value] += 1
        return RoutingDecision(
            target=target,
            confidence=confidence,
            reason=reason,
            fallback=fallback,
        )

    def stats(self) -> dict[str, Any]:
        """Поточні метрики роутера."""
        fallback_rate = (
            self._fallback_count / self._total_decisions
            if self._total_decisions > 0
            else 0.0
        )
        return {
            "total_decisions": self._total_decisions,
            "fallback_count": self._fallback_count,
            "fallback_rate": round(fallback_rate, 3),
            "per_target": dict(self._stats),
        }


# Глобальний сінглтон
smart_router = SmartDataRouter()
