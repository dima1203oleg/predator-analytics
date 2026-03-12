"""Competitors Router — Аналіз конкурентів.

Endpoints:
- /find — Пошук конкурентів
- /market — Аналіз ринку
- /benchmark — Бенчмаркінг
- /analysis — Комплексний аналіз
- /compare — Порівняння компаній
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.core.permissions import Permission
from app.dependencies import PermissionChecker, get_tenant_id
from app.services.competitors_analysis import (
    ComparisonMetric,
    CompetitorsAnalysisService,
)

router = APIRouter(prefix="/competitors", tags=["аналіз конкурентів"])


# ======================== REQUEST MODELS ========================


class FindCompetitorsRequest(BaseModel):
    """Запит на пошук конкурентів."""

    edrpou: str = Field(..., min_length=8, max_length=10, description="ЄДРПОУ компанії")
    kved: str | None = Field(None, description="Код КВЕД (якщо відрізняється)")
    region: str | None = Field(None, description="Регіон")
    limit: int = Field(default=10, ge=1, le=50, description="Кількість результатів")


class BenchmarkRequest(BaseModel):
    """Запит на бенчмаркінг."""

    edrpou: str = Field(..., min_length=8, max_length=10, description="ЄДРПОУ компанії")
    metrics: list[str] = Field(
        default=["revenue", "employees", "growth_rate"],
        description="Метрики для порівняння",
    )


class CompareRequest(BaseModel):
    """Запит на порівняння."""

    edrpou1: str = Field(..., min_length=8, max_length=10, description="ЄДРПОУ першої компанії")
    edrpou2: str = Field(..., min_length=8, max_length=10, description="ЄДРПОУ другої компанії")


# ======================== FIND COMPETITORS ========================


@router.post("/find", summary="Знайти конкурентів")
async def find_competitors(
    request: FindCompetitorsRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Знайти конкурентів компанії за КВЕД та регіоном.

    Алгоритм враховує:
    - Код КВЕД (основна діяльність)
    - Регіон присутності
    - Розмір компанії (виручка, працівники)
    - Темпи зростання
    """
    service = CompetitorsAnalysisService()

    competitors = await service.find_competitors(
        edrpou=request.edrpou,
        kved=request.kved,
        region=request.region,
        limit=request.limit,
    )

    return {
        "edrpou": request.edrpou,
        "total_found": len(competitors),
        "competitors": [
            {
                "edrpou": c.company.edrpou,
                "name": c.company.name,
                "kved": c.company.kved,
                "kved_name": c.company.kved_name,
                "revenue": c.company.revenue,
                "employees": c.company.employees,
                "region": c.company.region,
                "market_share": c.company.market_share,
                "growth_rate": c.company.growth_rate,
                "risk_score": c.company.risk_score,
                "similarity_score": c.similarity_score,
                "matching_factors": c.matching_factors,
                "competitive_advantage": c.competitive_advantage,
            }
            for c in competitors
        ],
    }


@router.get("/find/{edrpou}", summary="Знайти конкурентів (GET)")
async def find_competitors_get(
    edrpou: str,
    kved: Annotated[str | None, Query()] = None,
    region: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Знайти конкурентів компанії (GET метод)."""
    service = CompetitorsAnalysisService()

    competitors = await service.find_competitors(
        edrpou=edrpou,
        kved=kved,
        region=region,
        limit=limit,
    )

    return {
        "edrpou": edrpou,
        "total_found": len(competitors),
        "competitors": [
            {
                "edrpou": c.company.edrpou,
                "name": c.company.name,
                "similarity_score": c.similarity_score,
                "matching_factors": c.matching_factors,
            }
            for c in competitors
        ],
    }


# ======================== MARKET ANALYSIS ========================


@router.get("/market/{kved}", summary="Аналіз ринку")
async def analyze_market(
    kved: str,
    region: Annotated[str | None, Query()] = None,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Проаналізувати ринок за кодом КВЕД.

    Повертає:
    - Загальну кількість компаній
    - Сумарну та середню виручку
    - Лідерів ринку (топ-3)
    - Індекс концентрації (HHI)
    - Тренд зростання
    """
    service = CompetitorsAnalysisService()

    market = await service.analyze_market(kved, region)

    return {
        "kved": market.kved,
        "kved_name": market.kved_name,
        "total_companies": market.total_companies,
        "total_revenue": market.total_revenue,
        "average_revenue": market.average_revenue,
        "market_leaders": [
            {
                "edrpou": leader.edrpou,
                "name": leader.name,
                "revenue": leader.revenue,
                "market_share": leader.market_share,
            }
            for leader in market.market_leaders
        ],
        "market_concentration": market.market_concentration,
        "market_concentration_level": (
            "високий" if market.market_concentration > 2500
            else "середній" if market.market_concentration > 1500
            else "низький"
        ),
        "growth_trend": market.growth_trend,
    }


# ======================== BENCHMARKING ========================


@router.post("/benchmark", summary="Бенчмаркінг компанії")
async def benchmark_company(
    request: BenchmarkRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Порівняти компанію з ринковими показниками.

    Доступні метрики:
    - `revenue` — виручка
    - `employees` — кількість працівників
    - `market_share` — частка ринку
    - `growth_rate` — темп зростання
    - `profitability` — рентабельність
    - `risk_score` — оцінка ризику
    """
    service = CompetitorsAnalysisService()

    # Конвертуємо метрики
    metrics = [ComparisonMetric(m) for m in request.metrics]

    benchmarks = await service.benchmark_company(request.edrpou, metrics)

    return {
        "edrpou": request.edrpou,
        "benchmarks": [
            {
                "metric": b.metric.value,
                "company_value": b.company_value,
                "market_average": b.market_average,
                "market_median": b.market_median,
                "percentile": b.percentile,
                "position": b.position,
                "position_label": {
                    "leader": "Лідер",
                    "above_average": "Вище середнього",
                    "average": "Середній",
                    "below_average": "Нижче середнього",
                    "laggard": "Відстаючий",
                }.get(b.position, b.position),
            }
            for b in benchmarks
        ],
    }


@router.get("/benchmark/{edrpou}", summary="Бенчмаркінг (GET)")
async def benchmark_company_get(
    edrpou: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Бенчмаркінг компанії (GET метод) з базовими метриками."""
    service = CompetitorsAnalysisService()

    metrics = [
        ComparisonMetric.REVENUE,
        ComparisonMetric.EMPLOYEES,
        ComparisonMetric.GROWTH_RATE,
    ]

    benchmarks = await service.benchmark_company(edrpou, metrics)

    return {
        "edrpou": edrpou,
        "benchmarks": [
            {
                "metric": b.metric.value,
                "company_value": b.company_value,
                "market_average": b.market_average,
                "percentile": b.percentile,
                "position": b.position,
            }
            for b in benchmarks
        ],
    }


# ======================== COMPETITIVE ANALYSIS ========================


@router.get("/analysis/{edrpou}", summary="Комплексний конкурентний аналіз")
async def competitive_analysis(
    edrpou: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Комплексний конкурентний аналіз компанії.

    Включає:
    - Список конкурентів
    - Аналіз ринку
    - Бенчмаркінг за ключовими метриками
    - SWOT аналіз
    - Рекомендації
    """
    service = CompetitorsAnalysisService()

    analysis = await service.competitive_analysis(edrpou)

    return {
        "company": {
            "edrpou": analysis.company.edrpou,
            "name": analysis.company.name,
            "kved": analysis.company.kved,
            "kved_name": analysis.company.kved_name,
            "revenue": analysis.company.revenue,
            "employees": analysis.company.employees,
            "market_share": analysis.company.market_share,
            "growth_rate": analysis.company.growth_rate,
            "risk_score": analysis.company.risk_score,
        },
        "competitors": [
            {
                "edrpou": c.company.edrpou,
                "name": c.company.name,
                "revenue": c.company.revenue,
                "market_share": c.company.market_share,
                "similarity_score": c.similarity_score,
                "competitive_advantage": c.competitive_advantage,
            }
            for c in analysis.competitors
        ],
        "market": {
            "total_companies": analysis.market_analysis.total_companies,
            "total_revenue": analysis.market_analysis.total_revenue,
            "average_revenue": analysis.market_analysis.average_revenue,
            "market_concentration": analysis.market_analysis.market_concentration,
            "growth_trend": analysis.market_analysis.growth_trend,
        },
        "benchmarks": [
            {
                "metric": b.metric.value,
                "company_value": b.company_value,
                "market_average": b.market_average,
                "percentile": b.percentile,
                "position": b.position,
            }
            for b in analysis.benchmarks
        ],
        "swot": analysis.swot,
        "recommendations": analysis.recommendations,
        "generated_at": analysis.generated_at.isoformat(),
    }


# ======================== COMPARE ========================


@router.post("/compare", summary="Порівняти дві компанії")
async def compare_companies(
    request: CompareRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Детальне порівняння двох компаній."""
    service = CompetitorsAnalysisService()

    comparison = await service.compare_companies(request.edrpou1, request.edrpou2)

    return comparison


@router.get("/compare/{edrpou1}/{edrpou2}", summary="Порівняти (GET)")
async def compare_companies_get(
    edrpou1: str,
    edrpou2: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Порівняти дві компанії (GET метод)."""
    service = CompetitorsAnalysisService()

    comparison = await service.compare_companies(edrpou1, edrpou2)

    return comparison


# ======================== INSIGHTS ========================


@router.get("/insights/{edrpou}", summary="Конкурентні інсайти")
async def get_competitive_insights(
    edrpou: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати короткі конкурентні інсайти про компанію."""
    service = CompetitorsAnalysisService()

    # Знаходимо топ-3 конкурентів
    competitors = await service.find_competitors(edrpou, limit=3)

    # Бенчмаркінг
    benchmarks = await service.benchmark_company(
        edrpou,
        [ComparisonMetric.REVENUE, ComparisonMetric.GROWTH_RATE],
    )

    insights = []

    # Інсайти з конкурентів
    if competitors:
        top = competitors[0]
        insights.append({
            "type": "competitor",
            "title": "Головний конкурент",
            "message": f"{top.company.name} - схожість {top.similarity_score:.0f}%",
            "severity": "info",
        })

    # Інсайти з бенчмарків
    for b in benchmarks:
        if b.position == "leader":
            insights.append({
                "type": "strength",
                "title": "Сильна позиція",
                "message": f"Лідер за {b.metric.value} (топ 10%)",
                "severity": "success",
            })
        elif b.position == "laggard":
            insights.append({
                "type": "weakness",
                "title": "Слабка позиція",
                "message": f"Відстаючий за {b.metric.value} (нижні 20%)",
                "severity": "warning",
            })

    return {
        "edrpou": edrpou,
        "insights": insights,
        "total_competitors": len(competitors),
    }


# ======================== STATISTICS ========================


@router.get("/stats/overview", summary="Загальна статистика")
async def get_statistics_overview(
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати загальну статистику по конкурентному аналізу."""
    return {
        "total_companies": 4,
        "total_markets": 1,
        "popular_kveds": [
            {"kved": "62.01", "name": "Комп'ютерне програмування", "count": 4},
        ],
        "average_competitors_per_company": 3,
    }
