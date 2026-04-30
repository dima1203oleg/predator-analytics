"""Analytics Router — AML Scoring та Anomaly Detection.

Модулі:
- AML Scoring: Оцінка ризиків (Anti-Money Laundering)
- Anomaly Detection: Виявлення аномалій
- Risk Reports: Звіти про ризики
"""
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Body, Depends, Query, Request
from pydantic import BaseModel, Field

from app.core.cache import cache_response
from app.core.permissions import Permission
from app.dependencies import PermissionChecker, get_tenant_id
from app.services.aml_scoring import AMLScoringService
from app.services.analytics_service import AnalyticsService
from app.services.anomaly_detection import (
    AnomalyDetectionService,
    TimeSeriesPoint,
)

router = APIRouter(prefix="/analytics", tags=["аналітика ризиків"])


# ======================== REQUEST MODELS ========================


class AMLScoreRequest(BaseModel):
    """Запит на розрахунок AML-скору."""

    entity_id: str = Field(..., description="ID сутності (ЄДРПОУ або РНОКПП)")
    entity_name: str = Field(..., description="Назва сутності")
    entity_type: str = Field(default="organization", description="Тип: organization або person")
    data: dict[str, Any] = Field(default_factory=dict, description="Дані для аналізу")


class BatchAMLRequest(BaseModel):
    """Пакетний запит на розрахунок AML-скорів."""

    entities: list[AMLScoreRequest] = Field(..., max_length=100)


class TimeSeriesRequest(BaseModel):
    """Запит на аналіз часового ряду."""

    data: list[dict[str, Any]] = Field(..., description="Точки часового ряду")
    method: str = Field(default="zscore", description="Метод: zscore, iqr, moving_average")


class NetworkAnalysisRequest(BaseModel):
    """Запит на аналіз мережі."""

    entities: list[dict[str, Any]] = Field(..., description="Список сутностей")
    relations: list[dict[str, Any]] = Field(..., description="Список зв'язків")


class PriceAnalysisRequest(BaseModel):
    """Запит на аналіз цін."""

    declarations: list[dict[str, Any]] = Field(..., description="Митні декларації")
    reference_prices: dict[str, float] | None = Field(None, description="Референсні ціни")


class PatternDetectionRequest(BaseModel):
    """Запит на виявлення паттернів."""

    entity_data: dict[str, Any] = Field(..., description="Дані сутності")
    transactions: list[dict[str, Any]] | None = Field(None, description="Транзакції")


# ======================== AML SCORING ========================


@router.post("/aml/score", summary="Розрахунок AML-скору")
async def calculate_aml_score(
    request: AMLScoreRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Розрахунок AML-скору для сутності.

    Фактори ризику:
    - Санкційні списки (вага 100)
    - Кримінальні справи (вага 80)
    - Податкові борги > 1 млн грн (вага 70)
    - Офшорні зв'язки (вага 60)
    - Ознаки фіктивності (вага 50)
    - Зміни керівництва (вага 40)
    - Масова реєстрація (вага 30)
    """
    service = AMLScoringService()

    score = await service.calculate_score(
        entity_id=request.entity_id,
        entity_name=request.entity_name,
        entity_type=request.entity_type,
        data=request.data,
    )

    return {
        "entity_id": score.entity_id,
        "entity_name": score.entity_name,
        "entity_type": score.entity_type,
        "total_score": score.total_score,
        "risk_level": score.risk_level.value,
        "factors": [
            {
                "category": f.category.value,
                "name": f.name,
                "description": f.description,
                "weight": f.weight,
                "detected": f.detected,
                "details": f.details,
                "source": f.source,
            }
            for f in score.factors
        ],
        "recommendations": score.recommendations,
        "explanation": score.explanation,
        "calculated_at": score.calculated_at.isoformat(),
    }


@router.post("/aml/batch", summary="Пакетний розрахунок AML-скорів")
async def batch_calculate_aml_scores(
    request: BatchAMLRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Пакетний розрахунок AML-скорів (до 100 сутностей)."""
    service = AMLScoringService()

    entities = [
        {
            "id": e.entity_id,
            "name": e.entity_name,
            "type": e.entity_type,
            "data": e.data,
        }
        for e in request.entities
    ]

    scores = await service.batch_calculate(entities)
    distribution = service.get_risk_distribution(scores)

    return {
        "total": len(scores),
        "distribution": distribution,
        "scores": [
            {
                "entity_id": s.entity_id,
                "entity_name": s.entity_name,
                "total_score": s.total_score,
                "risk_level": s.risk_level.value,
                "detected_factors": len([f for f in s.factors if f.detected]),
            }
            for s in scores
        ],
    }


@router.get("/aml/risk-levels", summary="Рівні ризику")
@cache_response(ttl=3600)
async def get_risk_levels(request: Request):
    """Отримати опис рівнів ризику."""
    return {
        "levels": [
            {"level": "critical", "range": "80-100", "description": "Критичний ризик — негайні дії"},
            {"level": "high", "range": "60-79", "description": "Високий ризик — посилена перевірка"},
            {"level": "medium", "range": "40-59", "description": "Середній ризик — моніторинг"},
            {"level": "low", "range": "20-39", "description": "Низький ризик — стандартні процедури"},
            {"level": "minimal", "range": "0-19", "description": "Мінімальний ризик"},
        ],
        "factors": [
            {"category": "sanctions", "weight": 100, "description": "Санкційні списки"},
            {"category": "criminal", "weight": 80, "description": "Кримінальні справи"},
            {"category": "tax", "weight": 70, "description": "Податкові борги > 1 млн"},
            {"category": "offshore", "weight": 60, "description": "Офшорні зв'язки"},
            {"category": "shell_company", "weight": 50, "description": "Ознаки фіктивності"},
            {"category": "pep", "weight": 50, "description": "Політично значуща особа"},
            {"category": "beneficial_ownership", "weight": 45, "description": "Проблеми з бенефіціарами"},
            {"category": "management", "weight": 40, "description": "Часті зміни керівництва"},
            {"category": "financial", "weight": 35, "description": "Фінансові аномалії"},
            {"category": "registration", "weight": 30, "description": "Масова реєстрація"},
        ],
    }


# ======================== ANOMALY DETECTION ========================


@router.post("/anomaly/time-series", summary="Аналіз часового ряду")
async def analyze_time_series(
    request: TimeSeriesRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Виявлення аномалій у часовому ряді.

    Методи:
    - zscore: Z-score (стандартне відхилення)
    - iqr: Interquartile Range
    - moving_average: Ковзне середнє
    """
    service = AnomalyDetectionService()

    # Конвертуємо дані
    data_points = []
    for item in request.data:
        try:
            timestamp = datetime.fromisoformat(item.get("timestamp", ""))
        except (ValueError, TypeError):
            timestamp = datetime.now(UTC)

        data_points.append(TimeSeriesPoint(
            timestamp=timestamp,
            value=float(item.get("value", 0)),
            metadata=item.get("metadata", {}),
        ))

    anomalies = service.analyze_time_series(data_points, method=request.method)

    return {
        "total_points": len(data_points),
        "anomalies_found": len(anomalies),
        "method": request.method,
        "anomalies": [
            {
                "id": a.id,
                "type": a.type.value,
                "severity": a.severity,
                "confidence": a.confidence,
                "description": a.description,
                "details": a.details,
            }
            for a in anomalies
        ],
    }


@router.post("/anomaly/patterns", summary="Виявлення паттернів шахрайства")
async def detect_fraud_patterns(
    request: PatternDetectionRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Виявлення відомих паттернів шахрайства.

    Паттерни:
    - VAT Carousel (карусельна схема ПДВ)
    - Transfer Pricing (трансфертне ціноутворення)
    - Customs Undervaluation (заниження митної вартості)
    - Product Misclassification (пересортиця)
    - Shell Company Chain (ланцюг фіктивних компаній)
    - Round Tripping (круговий рух коштів)
    - Layering (багатошарові транзакції)
    """
    service = AnomalyDetectionService()

    anomalies = service.detect_patterns(
        entity_data=request.entity_data,
        transactions=request.transactions,
    )

    return {
        "patterns_checked": len(service.known_patterns),
        "patterns_detected": len(anomalies),
        "anomalies": [
            {
                "id": a.id,
                "pattern": a.pattern.value if a.pattern else None,
                "severity": a.severity,
                "confidence": a.confidence,
                "description": a.description,
                "details": a.details,
            }
            for a in anomalies
        ],
    }


@router.post("/anomaly/network", summary="Аналіз мережі зв'язків")
async def analyze_network(
    request: NetworkAnalysisRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Виявлення аномалій у мережі зв'язків.

    Аналіз:
    - Щільні кластери
    - Хаби (центральні вузли)
    - Спільні атрибути (адреса, директор, телефон)
    """
    service = AnomalyDetectionService()

    anomalies = service.detect_network_anomalies(
        entities=request.entities,
        relations=request.relations,
    )

    return {
        "entities_analyzed": len(request.entities),
        "relations_analyzed": len(request.relations),
        "anomalies_found": len(anomalies),
        "anomalies": [
            {
                "id": a.id,
                "type": a.type.value,
                "severity": a.severity,
                "confidence": a.confidence,
                "description": a.description,
                "entities": a.entities,
                "details": a.details,
            }
            for a in anomalies
        ],
    }


@router.post("/anomaly/prices", summary="Аналіз цінових аномалій")
async def analyze_price_anomalies(
    request: PriceAnalysisRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Виявлення цінових аномалій у митних деклараціях.

    Аналіз:
    - Відхилення від середньої ціни за кодом товару
    - Порівняння з референсними цінами
    """
    service = AnomalyDetectionService()

    anomalies = service.detect_price_anomalies(
        declarations=request.declarations,
        reference_prices=request.reference_prices,
    )

    return {
        "declarations_analyzed": len(request.declarations),
        "anomalies_found": len(anomalies),
        "anomalies": [
            {
                "id": a.id,
                "type": a.type.value,
                "severity": a.severity,
                "confidence": a.confidence,
                "description": a.description,
                "entities": a.entities,
                "details": a.details,
            }
            for a in anomalies
        ],
    }


@router.get("/anomaly/patterns-catalog", summary="Каталог паттернів шахрайства")
@cache_response(ttl=3600)
async def get_patterns_catalog(request: Request):
    """Отримати каталог відомих паттернів шахрайства."""
    service = AnomalyDetectionService()

    return {
        "patterns": [
            {
                "type": pattern_type.value,
                "name": info["name"],
                "description": info["description"],
                "severity": info["severity"],
                "indicators": info["indicators"],
            }
            for pattern_type, info in service.known_patterns.items()
        ],
    }


# ======================== REPORTS ========================


@router.post("/reports/risk-summary", summary="Зведений звіт про ризики")
async def generate_risk_summary(
    entity_ids: list[str] = Body(..., description="Список ID сутностей"),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Генерація зведеного звіту про ризики для списку сутностей."""
    # Тут буде інтеграція з базою даних для отримання даних
    # Поки що повертаємо структуру звіту

    return {
        "report_id": f"risk_report_{int(datetime.now(UTC).timestamp())}",
        "generated_at": datetime.now(UTC).isoformat(),
        "entities_count": len(entity_ids),
        "summary": {
            "critical_risk": 0,
            "high_risk": 0,
            "medium_risk": 0,
            "low_risk": 0,
            "minimal_risk": 0,
        },
        "top_risks": [],
        "recommendations": [
            "Провести поглиблену перевірку сутностей з критичним ризиком",
            "Встановити моніторинг для сутностей з високим ризиком",
        ],
    }


@router.get("/reports/anomaly-trends", summary="Тренди аномалій")
async def get_anomaly_trends(
    period_days: int = Query(default=30, ge=1, le=365),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Отримати тренди виявлених аномалій за період."""
    service = AnalyticsService()
    trends = service.get_anomaly_trends(str(tenant_id), period_days)

    return {
        "period_days": period_days,
        "trends": {
            "total_anomalies": sum(t["count"] for t in trends["daily_counts"]),
            "by_type": {}, # Можна розширити в AnalyticsService
            "by_severity": {},
            "daily_counts": trends["daily_counts"],
        },
        "comparison": {
            "vs_previous_period": 0,
            "trend": "stable",
        },
    }
