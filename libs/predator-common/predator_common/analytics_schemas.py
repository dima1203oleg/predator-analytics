\"\"\"Аналітичні схеми (Pydantic моделі) для PREDATOR Analytics.

Модуль містить типізовані моделі відповідей для:
- Фрод-кілець (Neo4j graph cycles)
- Тендерних агрегацій (ClickHouse OLAP)
- Sanctions Exposure (Neo4j path traversal)
- Influence Score (Neo4j degree analysis)
\"\"\"
from typing import Any

from pydantic import BaseModel, Field


# ======================== GRAPH ANALYTICS (Neo4j) ========================


class FraudRingItem(BaseModel):
    \"\"\"Одне виявлене фрод-кільце (циклічна структура власності).\"\"\"

    cycle: list[str] = Field(..., description=\"Ідентифікатори вузлів у циклі\")
    path_length: int = Field(..., description=\"Довжина циклу (кількість переходів)\")


class FraudRingResponse(BaseModel):
    \"\"\"Відповідь ендпоінту виявлення фрод-кілець.\"\"\"

    fraud_rings: list[FraudRingItem] = Field(
        default_factory=list, description=\"Список виявлених циклічних зв'язків\"
    )


class SanctionsPathNode(BaseModel):
    \"\"\"Вузол у шляху до підсанкційної сутності.\"\"\"

    id: str | None = Field(None, description=\"Ідентифікатор вузла\")
    labels: list[str] = Field(default_factory=list, description=\"Мітки вузла (Company, Person, Country)\")


class SanctionsExposurePath(BaseModel):
    \"\"\"Один шлях від компанії до підсанкційної сутності.\"\"\"

    path: list[SanctionsPathNode] = Field(..., description=\"Вузли шляху\")
    degrees_of_separation: int = Field(..., description=\"Кількість переходів\")


class SanctionsExposureResponse(BaseModel):
    \"\"\"Відповідь ендпоінту перевірки санкцій.\"\"\"

    sanctions_exposure: list[SanctionsExposurePath] = Field(
        default_factory=list, description=\"Список шляхів до підсанкційних сутностей\"
    )


class InfluenceScoreResponse(BaseModel):
    \"\"\"Відповідь ендпоінту оцінки впливу компанії.\"\"\"

    ueid: str = Field(..., description=\"ЄДРПОУ компанії\")
    degree_1: int = Field(default=0, description=\"Зв'язки 1-го рівня (прямі)\")
    degree_2: int = Field(default=0, description=\"Зв'язки 2-го рівня\")
    degree_3: int = Field(default=0, description=\"Зв'язки 3-го рівня\")
    total_influence_score: float = Field(
        default=0.0,
        description=\"Зважений індекс впливу (degree_1*1.0 + degree_2*0.5 + degree_3*0.1)\",
    )


# ======================== OLAP ANALYTICS (ClickHouse) ========================


class TenderAggregation(BaseModel):
    \"\"\"Агрегація тендерної активності компанії.\"\"\"

    ueid: str = Field(..., description=\"ЄДРПОУ компанії\")
    total_tenders: int = Field(default=0, description=\"Загальна кількість тендерів\")
    total_value: float = Field(default=0.0, description=\"Загальна сума тендерів (UAH)\")
    won_tenders: int = Field(default=0, description=\"Кількість виграних тендерів\")
    avg_tender_value: float = Field(default=0.0, description=\"Середня сума тендера\")
    currency_breakdown: dict[str, float] = Field(
        default_factory=dict, description=\"Розбивка за валютами\"
    )
    monthly_activity: list[dict[str, Any]] = Field(
        default_factory=list, description=\"Помісячна активність\"
    )


class TenderAggregationResponse(BaseModel):
    \"\"\"Відповідь ендпоінту агрегації тендерів.\"\"\"

    data: TenderAggregation
    source: str = Field(default=\"clickhouse\", description=\"Джерело даних\")
    cached: bool = Field(default=False, description=\"Чи з кешу\")


class TopSpenderItem(BaseModel):
    \"\"\"Один замовник у рейтингу витрат.\"\"\"

    procuring_entity_id: str = Field(..., description=\"ЄДРПОУ замовника\")
    procuring_entity_name: str = Field(..., description=\"Назва замовника\")
    tender_count: int = Field(default=0, description=\"Кількість тендерів\")
    total_spent: float = Field(default=0.0, description=\"Загальна сума витрат\")
    avg_value: float = Field(default=0.0, description=\"Середня сума тендера\")


class TopSpendersResponse(BaseModel):
    \"\"\"Відповідь ендпоінту топ замовників.\"\"\"

    top_spenders: list[TopSpenderItem] = Field(
        default_factory=list, description=\"Список замовників\"
    )
    source: str = Field(default=\"clickhouse\", description=\"Джерело даних\")
