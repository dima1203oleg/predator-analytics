"""
📊 Pydantic схеми для ринкової аналітики — PREDATOR Analytics v4.1.

Схеми запитів та відповідей для /api/v1/market.
"""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ── Запити ───────────────────────────────────────────────────

class DeclarationFilter(BaseModel):
    """Фільтри пошуку декларацій."""

    product_code: str | None = None
    company_edrpou: str | None = None
    country_code: str | None = None
    date_from: date | None = None
    date_to: date | None = None
    value_min: float | None = None
    value_max: float | None = None
    has_anomaly: bool | None = None


# ── Відповіді ────────────────────────────────────────────────

class TopProduct(BaseModel):
    """Топовий товар у огляді ринку."""

    code: str
    name: str
    value_usd: float
    change_percent: float


class MarketOverviewResponse(BaseModel):
    """Відповідь огляду ринку."""

    total_declarations: int
    total_value_usd: float
    total_companies: int
    top_products: list[TopProduct]
    period: str


class DeclarationResponse(BaseModel):
    """Одна митна декларація у відповіді."""

    id: str
    declaration_number: str
    declaration_date: str
    company_name: str
    company_edrpou: str
    product_code: str
    product_name: str
    country_code: str
    weight_kg: float
    value_usd: float
    anomaly_score: float | None = None

    model_config = {"from_attributes": True}


class DeclarationsListResponse(BaseModel):
    """Пагінований список декларацій."""

    items: list[DeclarationResponse]
    total: int
    page: int
    limit: int
