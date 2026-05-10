"""Тести Smart Data Router — класифікація запитів до 8 БД.

Очікувана точність евристик ≥90% на канонічному наборі запитів.
"""

from __future__ import annotations

import pytest

from app.services.smart_data_router import (
    DatabaseTarget,
    SmartDataRouter,
)


@pytest.fixture
def router() -> SmartDataRouter:
    """Свіжий роутер для кожного тесту (ізольовані метрики)."""
    return SmartDataRouter()


# ───── Явні хінти ─────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "mode,expected",
    [
        ("stream", DatabaseTarget.KAFKA),
        ("file", DatabaseTarget.MINIO),
        ("semantic", DatabaseTarget.QDRANT),
        ("search", DatabaseTarget.OPENSEARCH),
        ("transactional", DatabaseTarget.POSTGRESQL),
    ],
)
def test_explicit_mode_hint(router: SmartDataRouter, mode: str, expected: DatabaseTarget) -> None:
    decision = router.route("будь-що", hint_mode=mode)
    assert decision.target == expected
    assert decision.confidence >= 0.9


def test_graph_depth_hint(router: SmartDataRouter) -> None:
    decision = router.route("зв'язки компанії", hint_depth=3)
    assert decision.target == DatabaseTarget.NEO4J
    assert decision.fallback == DatabaseTarget.POSTGRESQL


def test_large_rows_hint(router: SmartDataRouter) -> None:
    decision = router.route("агрегація", hint_rows=500_000)
    assert decision.target == DatabaseTarget.CLICKHOUSE


# ───── Евристики на тексті ────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "query,expected",
    [
        # Graph
        ("Покажи зв'язки між компаніями", DatabaseTarget.NEO4J),
        ("Хто бенефіціар ТОВ Ромашка?", DatabaseTarget.NEO4J),
        ("UBO ownership chain", DatabaseTarget.NEO4J),
        ("Схема впливу олігарха", DatabaseTarget.NEO4J),
        # Aggregation / OLAP
        ("Топ-10 імпортерів за 2024 рік", DatabaseTarget.CLICKHOUSE),
        ("Статистика декларацій по регіонах", DatabaseTarget.CLICKHOUSE),
        ("Sum of imports за місяць", DatabaseTarget.CLICKHOUSE),
        ("Тренд митних ставок", DatabaseTarget.CLICKHOUSE),
        # Fulltext search
        ("Знайти декларації з фразою 'нафта'", DatabaseTarget.OPENSEARCH),
        ("Шукати документи про Шевченка", DatabaseTarget.OPENSEARCH),
        ("Search full text", DatabaseTarget.OPENSEARCH),
        # Semantic / RAG
        ("Знайти схоже на цей запит", DatabaseTarget.QDRANT),
        ("Semantic similarity query", DatabaseTarget.QDRANT),
        ("RAG context для LLM", DatabaseTarget.QDRANT),
        # Files
        ("Завантажити PDF декларації", DatabaseTarget.MINIO),
        ("Attachment file upload", DatabaseTarget.MINIO),
        ("Скан документа", DatabaseTarget.MINIO),
        # Transactional
        ("Create new user", DatabaseTarget.POSTGRESQL),
        ("Оновити статус справи", DatabaseTarget.POSTGRESQL),
        ("Delete record", DatabaseTarget.POSTGRESQL),
    ],
)
def test_heuristic_routing(
    router: SmartDataRouter,
    query: str,
    expected: DatabaseTarget,
) -> None:
    decision = router.route(query)
    assert decision.target == expected, (
        f"Запит '{query}' → очікували {expected.value}, отримали {decision.target.value}"
    )
    assert decision.confidence >= 0.5


# ───── Fallback поведінка ─────────────────────────────────────────────────────


def test_fallback_for_unclear_query(router: SmartDataRouter) -> None:
    """Незрозумілий запит → Postgres SSOT з низькою впевненістю."""
    decision = router.route("xyz random nonsense")
    assert decision.target == DatabaseTarget.POSTGRESQL
    assert decision.confidence < 0.5
    assert decision.fallback == DatabaseTarget.OPENSEARCH


# ───── Метрики ────────────────────────────────────────────────────────────────


def test_router_stats_tracking(router: SmartDataRouter) -> None:
    router.route("топ-10 компаній")
    router.route("зв'язки бенефіціарів")
    router.route("xyz nonsense")

    stats = router.stats()
    assert stats["total_decisions"] == 3
    assert stats["fallback_count"] == 1
    assert stats["fallback_rate"] == pytest.approx(1 / 3, abs=0.01)
    assert stats["per_target"]["clickhouse"] == 1
    assert stats["per_target"]["neo4j"] == 1
    assert stats["per_target"]["postgresql"] == 1


# ───── Точність на канонічному наборі ≥90% ────────────────────────────────────


def test_accuracy_threshold(router: SmartDataRouter) -> None:
    """Загальна точність ≥90% на 20+ тестових прикладах (HR-09)."""
    test_cases = [
        ("топ імпортерів", DatabaseTarget.CLICKHOUSE),
        ("зв'язки компанії", DatabaseTarget.NEO4J),
        ("знайти документ", DatabaseTarget.OPENSEARCH),
        ("семантично схоже", DatabaseTarget.QDRANT),
        ("create user", DatabaseTarget.POSTGRESQL),
        ("pdf файл", DatabaseTarget.MINIO),
        ("статистика за рік", DatabaseTarget.CLICKHOUSE),
        ("власник бізнесу", DatabaseTarget.NEO4J),
        ("шукати текст", DatabaseTarget.OPENSEARCH),
        ("rag context", DatabaseTarget.QDRANT),
        ("update запис", DatabaseTarget.POSTGRESQL),
        ("скан декларації", DatabaseTarget.MINIO),
        ("тренд цін", DatabaseTarget.CLICKHOUSE),
        ("ланцюжок власності", DatabaseTarget.NEO4J),
        ("fulltext пошук", DatabaseTarget.OPENSEARCH),
        ("similar vectors", DatabaseTarget.QDRANT),
        ("транзакція", DatabaseTarget.POSTGRESQL),
        ("upload blob", DatabaseTarget.MINIO),
        ("гістограма", DatabaseTarget.CLICKHOUSE),
        ("мережа впливу", DatabaseTarget.NEO4J),
    ]

    correct = sum(
        1 for query, expected in test_cases if router.route(query).target == expected
    )
    accuracy = correct / len(test_cases)
    assert accuracy >= 0.9, f"Точність {accuracy:.0%} < 90%"
