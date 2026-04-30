"""📈 Pydantic схеми для прогнозування — PREDATOR Analytics v4.1.

Схеми запитів та відповідей для /api/v1/forecast.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

# ── Запити ───────────────────────────────────────────────────

class ForecastDemandRequest(BaseModel):
    """Запит на прогнозування попиту."""

    product_code: str = Field(
        default="84713000",
        description="Код товару за УКТЗЕД",
    )
    country_code: str | None = Field(
        default=None,
        description="Код країни (ISO 3166-1 alpha-2)",
    )
    months_ahead: int = Field(
        default=6,
        ge=1,
        le=24,
        description="Кількість місяців для прогнозу",
    )
    model: str = Field(
        default="prophet",
        description="Модель прогнозування (prophet, xgboost, ensemble)",
    )


# ── Відповіді ────────────────────────────────────────────────

class ForecastPoint(BaseModel):
    """Одна точка прогнозу."""

    date: str
    predicted_volume: int
    confidence_lower: int
    confidence_upper: int


class ForecastResponse(BaseModel):
    """Відповідь з прогнозом попиту."""

    product_code: str
    product_name: str
    country_code: str | None = None
    model_used: str
    source: str = Field(description="Походження даних: real або synthetic")
    confidence_score: float = Field(ge=0, le=1)
    mape: float = Field(ge=0, le=1)
    data_points_used: int
    forecast: list[ForecastPoint]
    feature_importance: dict | None = None
    interpretation_uk: str  # Пояснення українською


class ForecastModel(BaseModel):
    """Опис доступної моделі прогнозування."""

    key: str
    name_uk: str
    description_uk: str


class ForecastModelsResponse(BaseModel):
    """Список доступних моделей."""

    models: list[ForecastModel]
