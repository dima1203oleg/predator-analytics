"""Decision Engine Router — PREDATOR Analytics v55.2-SM-EXTENDED.

Єдиний API-шар для сценарних бізнес-рекомендацій:
- best / worst / optimal
- скоринг альтернатив
- пояснення причин рішення
"""

from datetime import UTC, datetime
from enum import StrEnum

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.dependencies import get_current_active_user, get_tenant_id

router = APIRouter(prefix="/decision-engine", tags=["decision-intelligence"])


class DecisionScenario(StrEnum):
    """Підтримувані сценарії прийняття рішень."""

    BEST = "best"
    WORST = "worst"
    OPTIMAL = "optimal"


class DecisionOption(BaseModel):
    """Альтернатива для вибору в межах рішення."""

    option_id: str
    title: str
    score: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str
    risk_flags: list[str] = Field(default_factory=list)


class DecisionRecommendation(BaseModel):
    """Структурована рекомендація Decision Engine."""

    recommendation_id: str
    scenario: DecisionScenario
    summary: str
    recommended_action: str
    options: list[DecisionOption] = Field(default_factory=list)
    generated_at: str
    source_modules: list[str] = Field(default_factory=list)


class DecisionRequest(BaseModel):
    """Вхідний запит для генерації рішення."""

    entity_id: str = Field(description="Код компанії/контрагента або внутрішній ID")
    hs_code: str | None = Field(default=None, description="Код товару (опційно)")
    horizon_days: int = Field(default=90, ge=1, le=365)
    scenario: DecisionScenario = DecisionScenario.OPTIMAL


@router.post("/recommend", response_model=DecisionRecommendation)
async def recommend_decision(
    payload: DecisionRequest,
    _user: dict = Depends(get_current_active_user),
    tenant_id: str = Depends(get_tenant_id),
) -> DecisionRecommendation:
    """Повертає уніфікований каркас рішення для подальшої інтеграції сервісів.

    Поточна версія є каркасом інтеграції: замість моків тут має бути
    агрегація модулів market/procurement/competitors/risk/predictive.
    """
    now_iso = datetime.now(UTC).isoformat()

    if payload.scenario == DecisionScenario.WORST:
        summary = "Високий ризик входу в нішу за поточних умов."
        action = "Уникати закупівлі до стабілізації ціни та ризик-профілю."
    elif payload.scenario == DecisionScenario.BEST:
        summary = "Найагресивніший сценарій росту за сприятливого ринку."
        action = "Входити поетапно: тестова партія, потім масштабування."
    else:
        summary = "Збалансований сценарій з урахуванням ризику та маржі."
        action = "Запустити закупівлю обмеженим обсягом з контрольними KPI."

    return DecisionRecommendation(
        recommendation_id=f"dec-{payload.entity_id}-{payload.scenario.value}",
        scenario=payload.scenario,
        summary=summary,
        recommended_action=action,
        options=[
            DecisionOption(
                option_id="opt-1",
                title="Постачальник A / Туреччина",
                score=0.78,
                confidence=0.71,
                rationale="Стабільна ціна, помірний логістичний ризик, середня маржа.",
                risk_flags=["волатильність_курсу"],
            ),
            DecisionOption(
                option_id="opt-2",
                title="Постачальник B / Китай",
                score=0.74,
                confidence=0.69,
                rationale="Нижча ціна закупівлі, але вищий ризик затримки поставок.",
                risk_flags=["логістичний_ризик", "строк_доставки"],
            ),
        ],
        generated_at=now_iso,
        source_modules=[
            "market_intelligence",
            "procurement_intelligence",
            "competitor_intelligence",
            "risk_engine",
            "predictive_engine",
            f"tenant:{tenant_id}",
        ],
    )
