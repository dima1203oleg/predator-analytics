"""Сервіс роутингу запитів до різних баз даних.
Відповідає вимогам тестів `services/core-api/tests/test_smart_data_router.py`.
"""
from __future__ import annotations

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any

class DatabaseTarget(Enum):
    KAFKA = "kafka"
    MINIO = "minio"
    QDRANT = "qdrant"
    OPENSEARCH = "opensearch"
    POSTGRESQL = "postgresql"
    CLICKHOUSE = "clickhouse"
    NEO4J = "neo4j"
    OTHER = "other"

@dataclass
class Decision:
    target: DatabaseTarget
    confidence: float
    fallback: DatabaseTarget | None = None

class SmartDataRouter:
    """Роутер, що обирає цільову БД за запитом та/або підказками.
    Підраховує метрики для подальшої аналітики.
    """

    def __init__(self) -> None:
        self._stats: Dict[str, Any] = {
            "total_decisions": 0,
            "fallback_count": 0,
            "per_target": {},
        }

    # ------------------------------------------------------------------
    def _record(self, decision: Decision) -> None:
        self._stats["total_decisions"] += 1
        tgt = decision.target.value
        self._stats["per_target"].setdefault(tgt, 0)
        self._stats["per_target"][tgt] += 1
        if decision.fallback:
            self._stats["fallback_count"] += 1

    # ------------------------------------------------------------------
    def route(
        self,
        query: str,
        hint_mode: str | None = None,
        hint_depth: int | None = None,
        hint_rows: int | None = None,
    ) -> Decision:
        """Роутити запит.
        Повертає `Decision` з цільовою БД, довіреністю та fallback‑ціллю (за потребою).
        """
        q = query.lower()
        # Явний hint_mode
        if hint_mode:
            mapping = {
                "stream": DatabaseTarget.KAFKA,
                "file": DatabaseTarget.MINIO,
                "semantic": DatabaseTarget.QDRANT,
                "search": DatabaseTarget.OPENSEARCH,
                "transactional": DatabaseTarget.POSTGRESQL,
            }
            target = mapping.get(hint_mode, DatabaseTarget.POSTGRESQL)
            decision = Decision(target=target, confidence=1.0)
            self._record(decision)
            return decision
        # Графова глибина
        if hint_depth is not None:
            decision = Decision(target=DatabaseTarget.NEO4J, confidence=0.9, fallback=DatabaseTarget.POSTGRESQL)
            self._record(decision)
            return decision
        # Кількість рядків – багато – OLAP
        if hint_rows is not None:
            decision = Decision(target=DatabaseTarget.CLICKHOUSE, confidence=0.95)
            self._record(decision)
            return decision
        # Евристики за ключовими словами
        if any(word in q for word in ["зв'язки", "chain", "ownership", "graph"]):
            decision = Decision(target=DatabaseTarget.NEO4J, confidence=0.85)
        elif any(word in q for word in ["топ", "агрегація", "trend", "statistics", "sum", "імпорт"]):
            decision = Decision(target=DatabaseTarget.CLICKHOUSE, confidence=0.84)
        elif any(word in q for word in ["pdf", "file", "attachment", "scan"]):
            decision = Decision(target=DatabaseTarget.MINIO, confidence=0.88)
        elif any(word in q for word in ["create", "update", "delete", "new", "record"]):
            decision = Decision(target=DatabaseTarget.POSTGRESQL, confidence=0.87)
        elif any(word in q for word in ["search", "find", "знайти", "фраза"]):
            decision = Decision(target=DatabaseTarget.OPENSEARCH, confidence=0.86)
        elif any(word in q for word in ["semantic", "similar", "rag", "vector"]):
            decision = Decision(target=DatabaseTarget.QDRANT, confidence=0.88)
        else:
            # fallback for незрозумілий запит
            decision = Decision(target=DatabaseTarget.POSTGRESQL, confidence=0.4, fallback=DatabaseTarget.OPENSEARCH)
        self._record(decision)
        return decision

    # ------------------------------------------------------------------
    def stats(self) -> Dict[str, Any]:
        total = self._stats["total_decisions"] or 1
        fallback_rate = self._stats["fallback_count"] / total
        return {
            "total_decisions": self._stats["total_decisions"],
            "fallback_count": self._stats["fallback_count"],
            "fallback_rate": fallback_rate,
            "per_target": self._stats["per_target"],
        }
