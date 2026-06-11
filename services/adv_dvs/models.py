"""
Pydantic-схеми для ADV-DVS v56.5.
Повна типізація результатів діагностики системи PREDATOR Analytics.
"""
from datetime import UTC, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class CheckStatus(str, Enum):
    """Статус окремої перевірки."""

    OK = "ok"
    WARN = "warn"
    FAIL = "fail"


class CheckResult(BaseModel):
    """Результат окремої перевірки.

    Поля:
        name     – назва перевірки (frontend / backend / kafka / redis / db / neo4j / clickhouse / opensearch / qdrant / minio)
        status   – ok / warn / fail
        details  – додаткова інформація (помилка або час відповіді)
        latency_ms – час виконання в мілісекундах
    """

    name: str = Field(..., description="Назва перевірки")
    status: CheckStatus = Field(..., description="Статус: ok / warn / fail")
    details: Optional[str] = Field(None, description="Деталі результату або опис помилки")
    latency_ms: Optional[float] = Field(None, description="Час відповіді в мс")


class RunResponse(BaseModel):
    """Відповідь на POST /run — сукупний результат усіх перевірок."""

    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC), description="Час запуску перевірок (UTC)")
    overall: CheckStatus = Field(..., description="Загальний статус (найгірший з усіх перевірок)")
    results: list[CheckResult] = Field(..., description="Список результатів перевірок")
