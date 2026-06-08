"""DB Admin Router — уніфікований контроль всіх 8 БД (HR-17..HR-20).

Доступ: виключно роль ADMIN (audiences: ['admin']).
Дотримується ізоляції адмін-зони від бізнес-даних.
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.health import health_service
from app.services.smart_data_router import smart_router
from predator_common.logging import get_logger

logger = get_logger("core_api.db_admin")

router = APIRouter(prefix="/admin/db", tags=["admin", "databases"])

SUPPORTED_DBS = {
    "postgresql",
    "clickhouse",
    "neo4j",
    "opensearch",
    "qdrant",
    "redis",
    "minio",
    "kafka",
}


class QueryIntent(BaseModel):
    """Запит для Smart Data Router."""

    query: str = Field(..., min_length=3, max_length=2000, description="Природномовний опис наміру")
    depth: int | None = Field(default=None, ge=0, le=10, description="Глибина графових хопів")
    rows: int | None = Field(default=None, ge=0, description="Очікувана кількість рядків")
    mode: Literal["transactional", "analytical", "search", "semantic", "file", "stream"] | None = None


@router.get("/health", summary="Агрегований health 8 БД")
async def databases_health() -> dict[str, Any]:
    """Повертає стан усіх 8 БД платформи.

    Використовується Database Command Center (admin-only UI).
    """
    full = await health_service.comprehensive_health_check()
    services = full.get("services", {})

    db_services = {
        name: services.get(name, {"status": "unknown"})
        for name in SUPPORTED_DBS
    }

    summary = {
        "total": len(db_services),
        "healthy": sum(1 for s in db_services.values() if s.get("status") == "ok"),
        "degraded": sum(
            1 for s in db_services.values() if s.get("status") in {"degraded", "offline"}
        ),
        "failed": sum(1 for s in db_services.values() if s.get("status") == "error"),
    }

    overall = "ok" if summary["failed"] == 0 and summary["degraded"] == 0 else "degraded"
    if summary["failed"] > 0:
        overall = "critical"

    return {
        "overall": overall,
        "summary": summary,
        "databases": db_services,
        "timestamp": full.get("timestamp"),
    }


@router.get("/contract", summary="System Memory Contract v4.0")
async def memory_contract() -> dict[str, Any]:
    """Описує призначення кожної з 8 БД (контракт ролей)."""
    return {
        "version": "4.0",
        "description": "Кожна БД має строгу роль. Порушення контракту = архітектурний борг.",
        "databases": [
            {
                "id": "postgresql",
                "role": "SSOT",
                "nickname": "Хранитель Істини",
                "purpose": "Метадані, користувачі, фінансові реєстри, транзакції.",
                "rules": ["HR-16 WORM", "HR-07 No SELECT *", "HR-18 Тільки транзакції"],  # noqa
            },
            {
                "id": "clickhouse",
                "role": "OLAP",
                "nickname": "Аналітичний Мозок",
                "purpose": "Агрегації, історичні дані, масиви 100M+.",
                "rules": ["HR-17 Єдине джерело аналітики >100k"],
            },
            {
                "id": "opensearch",
                "role": "Search",
                "nickname": "Текстова Розвідка",
                "purpose": "Keyword/Hybrid пошук по документах.",
                "rules": ["HR-19 Не використовувати як Primary DB"],
            },
            {
                "id": "qdrant",
                "role": "Vector",
                "nickname": "AI Пам'ять",
                "purpose": "Embeddings для RAG та семантичного пошуку.",
                "rules": ["HR-20 Тільки вектори"],
            },
            {
                "id": "neo4j",
                "role": "Graph",
                "nickname": "Детектор Зв'язків",
                "purpose": "Схеми власності, фрод-ланцюжки, multi-hop аналіз.",
                "rules": [],
            },
            {
                "id": "redis",
                "role": "Cache",
                "nickname": "Швидка Пам'ять",
                "purpose": "Короткострокові дані, черги, сесії.",
                "rules": [],
            },
            {
                "id": "minio",
                "role": "S3",
                "nickname": "Фізичне Сховище",
                "purpose": "Файли, скани, PDF, blob.",
                "rules": [],
            },
            {
                "id": "kafka",
                "role": "EventBus",
                "nickname": "Нервова Система",
                "purpose": "Event streams, CDC, ingestion pipelines.",
                "rules": [],
            },
        ],
    }


@router.post("/router/classify", summary="Smart Data Router — класифікація запиту")
async def classify_query(intent: QueryIntent) -> dict[str, Any]:
    """Визначає оптимальну БД для запиту.

    Використовується UI (SmartSearch) для XAI-пояснення вибору сховища.
    """
    decision = smart_router.route(
        query=intent.query,
        hint_depth=intent.depth,
        hint_rows=intent.rows,
        hint_mode=intent.mode,
    )
    return {
        "query": intent.query,
        "decision": decision.to_dict(),
    }


@router.get("/router/stats", summary="Метрики Smart Data Router")
async def router_stats() -> dict[str, Any]:
    """Повертає статистику рішень роутера (для адмін-панелі + Prometheus)."""
    return smart_router.stats()


@router.get("/{db_id}/info", summary="Деталі конкретної БД")
async def database_info(db_id: str) -> dict[str, Any]:
    """Повертає стан та метадані однієї БД.

    Параметри
    ---------
    db_id : postgresql | clickhouse | neo4j | opensearch | qdrant | redis | minio | kafka
    """
    if db_id not in SUPPORTED_DBS:
        raise HTTPException(status_code=404, detail=f"Невідома БД: {db_id}")

    check_fn = getattr(health_service, f"check_{db_id}", None)
    if check_fn is None:
        raise HTTPException(status_code=501, detail=f"Health-check для {db_id} не реалізовано")

    result = await check_fn()
    return {
        "database": db_id,
        "health": result,
    }
