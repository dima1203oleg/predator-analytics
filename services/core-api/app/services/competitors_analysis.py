"""Competitors Analysis Service — Аналіз конкурентів.

Функції:
- Пошук конкурентів за КВЕД
- Порівняльний аналіз
- Бенчмаркінг
- Ринкова позиція
"""
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
import logging
from typing import Any, Dict # Додано Dict для більш точної типізації

logger = logging.getLogger(__name__)


class ComparisonMetric(StrEnum):
    """Метрики порівняння."""

    REVENUE = "revenue"
    EMPLOYEES = "employees"
    MARKET_SHARE = "market_share"
    GROWTH_RATE = "growth_rate"
    PROFITABILITY = "profitability"
    RISK_SCORE = "risk_score"


@dataclass
class CompanyProfile:
    """Профіль компанії."""

    edrpou: str
    name: str
    kved: str
    kved_name: str
    revenue: float | None = None
    employees: int | None = None
    founded_year: int | None = None
    region: str | None = None
    market_share: float | None = None
    growth_rate: float | None = None
    risk_score: int | None = None


@dataclass
class CompetitorMatch:
    """Знайдений конкурент."""

    company: CompanyProfile
    similarity_score: float
    matching_factors: list[str]
    competitive_advantage: str | None = None


@dataclass
class MarketAnalysis:
    """Аналіз ринку."""

    kved: str
    kved_name: str
    total_companies: int
    total_revenue: float
    average_revenue: float
    market_leaders: list[CompanyProfile]
    market_concentration: float  # HHI index
    growth_trend: str  # growing, stable, declining


@dataclass
class BenchmarkResult:
    """Результат бенчмаркінгу."""

    company_edrpou: str
    metric: ComparisonMetric
    company_value: float
    market_average: float
    market_median: float
    percentile: float  # 0-100
    position: str  # leader, above_average, average, below_average, laggard


@dataclass
class CompetitiveAnalysis:
    """Комплексний конкурентний аналіз."""

    company: CompanyProfile
    competitors: list[CompetitorMatch]
    market_analysis: MarketAnalysis
    benchmarks: list[BenchmarkResult]
    swot: dict[str, list[str]]
    recommendations: list[str]
    generated_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class CompetitorsAnalysisService:
    """Сервіс для аналізу конкурентів."""

    def __init__(self) -> None:
        # Mock дані для демонстрації
        self.companies_db = self._init_mock_companies()

    def _init_mock_companies(self) -> Dict[str, CompanyProfile]: # Властивості словника можуть бути довільними
        """Ініціалізація mock даних компаній."""
        return {
            "12345678": CompanyProfile(
                edrpou="12345678",
                name="ТОВ \"ТЕСТ\"",
                kved="62.01",
                kved_name="Комп'ютерне програмування",
                revenue=50_000_000,
                employees=150,
                founded_year=2015,
                region="Київська",
                market_share=2.5,
                growth_rate=15.0,
                risk_score=25,
            ),
            "87654321": CompanyProfile(
                edrpou="87654321",
                name="ТОВ \"КОНКУРЕНТ А\"",
                kved="62.01",
                kved_name="Комп'ютерне програмування",
                revenue=80_000_000,
                employees=250,
                founded_year=2010,
                region="Київська",
                market_share=4.0,
                growth_rate=20.0,
                risk_score=15,
            ),
            "11111111": CompanyProfile(
                edrpou="11111111",
                name="ТОВ \"КОНКУРЕНТ Б\"",
                kved="62.01",
                kved_name="Комп'ютерне програмування",
                revenue=120_000_000,
                employees=400,
                founded_year=2008,
                region="Київська",
                market_share=6.0,
                growth_rate=12.0,
                risk_score=20,
            ),
            "22222222": CompanyProfile(
                edrpou="22222222",
                name="ТОВ \"ЛІДЕР РИНКУ\"",
                kved="62.01",
                kved_name="Комп'ютерне програмування",
                revenue=300_000_000,
                employees=1000,
                founded_year=2005,
                region="Київська",
                market_share=15.0,
                growth_rate=8.0,
                risk_score=10,
            ),
        }

    async def find_competitors(
        self,
        edrpou: str,
        kved: str | None = None,
        region: str | None = None,
        limit: int = 10,
    ) -> list[CompetitorMatch]:
        """Знайти конкурентів компанії."""
        company = self.companies_db.get(edrpou)
        if not company:
            # Mock компанія
            company = CompanyProfile(
                edrpou=edrpou,
                name=f"Компанія {edrpou}",
                kved=kved or "62.01",
                kved_name="Комп'ютерне програмування",
                revenue=50_000_000,
                employees=100,
                region=region or "Київська",
            )

        # Знаходимо конкурентів за КВЕД
        target_kved = kved or company.kved
        competitors = []

        for comp_edrpou, comp in self.companies_db.items():
            if comp_edrpou == edrpou:
                continue

            if comp.kved != target_kved:
                continue

            if region and comp.region != region:
                continue

            # Розраховуємо схожість
            similarity = self._calculate_similarity(company, comp)
            matching_factors = self._get_matching_factors(company, comp)

            competitors.append(CompetitorMatch(
                company=comp,
                similarity_score=similarity,
                matching_factors=matching_factors,
                competitive_advantage=self._analyze_advantage(company, comp),
            ))

        # Сортуємо за схожістю
        competitors.sort(key=lambda x: x.similarity_score, reverse=True)
        return competitors[:limit]

    def _calculate_similarity(self, company1: CompanyProfile, company2: CompanyProfile) -> float:
        """Розрахувати схожість між компаніями."""
        score = 0.0

        # КВЕД (найважливіше)
        if company1.kved == company2.kved:
            score += 40

        # Регіон
        if company1.region == company2.region:
            score += 20

        # Розмір (за виручкою)
        if company1.revenue and company2.revenue:
            ratio = min(company1.revenue, company2.revenue) / max(company1.revenue, company2.revenue)
            score += ratio * 20

        # Кількість працівників
        if company1.employees and company2.employees:
            ratio = min(company1.employees, company2.employees) / max(company1.employees, company2.employees)
            score += ratio * 20

        return min(score, 100)

    def _get_matching_factors(self, company1: CompanyProfile, company2: CompanyProfile) -> list[str]:
        """Отримати фактори схожості."""
        factors = []

        if company1.kved == company2.kved:
            factors.append("Однаковий КВЕД")

        if company1.region == company2.region:
            factors.append("Той самий регіон")

        if company1.revenue and company2.revenue:
            ratio = company1.revenue / company2.revenue
            if 0.7 <= ratio <= 1.3:
                factors.append("Схожий розмір виручки")

        if company1.employees and company2.employees:
            ratio = company1.employees / company2.employees
            if 0.7 <= ratio <= 1.3:
                factors.append("Схожа кількість працівників")

        return factors

    def _analyze_advantage(self, company: CompanyProfile, competitor: CompanyProfile) -> str | None:
        """Проаналізувати конкурентну перевагу."""
        if not company.revenue or not competitor.revenue:
            return None

        if company.revenue > competitor.revenue * 1.5:
            return "Значно більша виручка"
        elif competitor.revenue > company.revenue * 1.5:
            return "Конкурент має значно більшу виручку"

        if company.growth_rate and competitor.growth_rate:
            if company.growth_rate > competitor.growth_rate + 10:
                return "Вищі темпи зростання"
            elif competitor.growth_rate > company.growth_rate + 10:
                return "Конкурент зростає швидше"

        return "Приблизно рівні позиції"

    async def analyze_market(self, kved: str, region: str | None = None) -> MarketAnalysis:
        """Проаналізувати ринок за КВЕД."""
        # Фільтруємо компанії
        companies = [
            c for c in self.companies_db.values()
            if c.kved == kved and (not region or c.region == region)
        ]

        if not companies:
            return MarketAnalysis(
                kved=kved,
                kved_name="Невідомо",
                total_companies=0,
                total_revenue=0,
                average_revenue=0,
                market_leaders=[],
                market_concentration=0,
                growth_trend="unknown",
            )

        # Розраховуємо метрики
        total_revenue = sum(c.revenue or 0 for c in companies)
        average_revenue = total_revenue / len(companies) if companies else 0

        # Лідери ринку (топ-3)
        leaders = sorted(companies, key=lambda c: c.revenue or 0, reverse=True)[:3]

        # HHI (Herfindahl-Hirschman Index)
        hhi = sum((c.market_share or 0) ** 2 for c in companies)

        # Тренд зростання
        avg_growth = sum(c.growth_rate or 0 for c in companies) / len(companies)
        if avg_growth > 10:
            trend = "growing"
        elif avg_growth > 0:
            trend = "stable"
        else:
            trend = "declining"

        return MarketAnalysis(
            kved=kved,
            kved_name=companies[0].kved_name,
            total_companies=len(companies),
            total_revenue=total_revenue,
            average_revenue=average_revenue,
            market_leaders=leaders,
            market_concentration=hhi,
            growth_trend=trend,
        )

    async def benchmark_company(
        self,
        edrpou: str,
        metrics: list[ComparisonMetric],
    ) -> list[BenchmarkResult]:
        """Бенчмаркінг компанії."""
        company = self.companies_db.get(edrpou)
        if not company:
            return []

        # Отримуємо компанії з того ж ринку
        market_companies = [
            c for c in self.companies_db.values()
            if c.kved == company.kved
        ]

        results = []

        for metric in metrics:
            result = self._benchmark_metric(company, market_companies, metric)
            if result:
                results.append(result)

        return results

    def _benchmark_metric(
        self,
        company: CompanyProfile,
        market: list[CompanyProfile],
        metric: ComparisonMetric,
    ) -> BenchmarkResult | None:
        """Бенчмаркінг за конкретною метрикою."""
        # Отримуємо значення метрики
        values = []
        company_value = None

        for c in market:
            if metric == ComparisonMetric.REVENUE and c.revenue:
                values.append(c.revenue)
                if c.edrpou == company.edrpou:
                    company_value = c.revenue
            elif metric == ComparisonMetric.EMPLOYEES and c.employees:
                values.append(c.employees)
                if c.edrpou == company.edrpou:
                    company_value = c.employees
            elif metric == ComparisonMetric.GROWTH_RATE and c.growth_rate:
                values.append(c.growth_rate)
                if c.edrpou == company.edrpou:
                    company_value = c.growth_rate
            elif metric == ComparisonMetric.RISK_SCORE and c.risk_score:
                values.append(c.risk_score)
                if c.edrpou == company.edrpou:
                    company_value = c.risk_score

        if not values or company_value is None:
            return None

        # Розраховуємо статистики
        average = sum(values) / len(values)
        sorted_values = sorted(values)
        median = sorted_values[len(sorted_values) // 2]

        # Перцентиль
        percentile = (sum(1 for v in values if v <= company_value) / len(values)) * 100

        # Позиція
        if percentile >= 90:
            position = "leader"
        elif percentile >= 60:
            position = "above_average"
        elif percentile >= 40:
            position = "average"
        elif percentile >= 20:
            position = "below_average"
        else:
            position = "laggard"

        return BenchmarkResult(
            company_edrpou=company.edrpou,
            metric=metric,
            company_value=company_value,
            market_average=average,
            market_median=median,
            percentile=percentile,
            position=position,
        )

    async def competitive_analysis(self, edrpou: str) -> CompetitiveAnalysis:
        """Комплексний конкурентний аналіз."""
        company = self.companies_db.get(edrpou)
        if not company:
            company = CompanyProfile(
                edrpou=edrpou,
                name=f"Компанія {edrpou}",
                kved="62.01",
                kved_name="Комп'ютерне програмування",
            )

        # Знаходимо конкурентів
        competitors = await self.find_competitors(edrpou, limit=5)

        # Аналізуємо ринок
        market = await self.analyze_market(company.kved, company.region)

        # Бенчмаркінг
        benchmarks = await self.benchmark_company(
            edrpou,
            [
                ComparisonMetric.REVENUE,
                ComparisonMetric.EMPLOYEES,
                ComparisonMetric.GROWTH_RATE,
                ComparisonMetric.RISK_SCORE,
            ],
        )

        # SWOT аналіз
        swot = self._generate_swot(company, competitors, market, benchmarks)

        # Рекомендації
        recommendations = self._generate_recommendations(company, competitors, market, benchmarks)

        return CompetitiveAnalysis(
            company=company,
            competitors=competitors,
            market_analysis=market,
            benchmarks=benchmarks,
            swot=swot,
            recommendations=recommendations,
        )

    def _generate_swot(
        self,
        company: CompanyProfile,
        competitors: list[CompetitorMatch],
        market: MarketAnalysis,
        benchmarks: list[BenchmarkResult],
    ) -> dict[str, list[str]]:
        """Генерувати SWOT аналіз."""
        strengths = []
        weaknesses = []
        opportunities = []
        threats = []

        # Сильні сторони
        for b in benchmarks:
            if b.position in ["leader", "above_average"]:
                strengths.append(f"Вище середнього за {b.metric.value}")

        if company.growth_rate and company.growth_rate > 15:
            strengths.append("Високі темпи зростання")

        if company.risk_score and company.risk_score < 30:
            strengths.append("Низький рівень ризику")

        # Слабкі сторони
        for b in benchmarks:
            if b.position in ["below_average", "laggard"]:
                weaknesses.append(f"Нижче середнього за {b.metric.value}")

        # Можливості
        if market.growth_trend == "growing":
            opportunities.append("Зростаючий ринок")

        if market.market_concentration < 1500:
            opportunities.append("Низька концентрація ринку - можливості для зростання")

        # Загрози
        if len(competitors) > 3:
            threats.append("Висока конкуренція")

        for comp in competitors[:2]:
            if comp.company.market_share and comp.company.market_share > (company.market_share or 0) * 2:
                threats.append(f"Сильний конкурент: {comp.company.name}")

        return {
            "strengths": strengths or ["Недостатньо даних"],
            "weaknesses": weaknesses or ["Недостатньо даних"],
            "opportunities": opportunities or ["Недостатньо даних"],
            "threats": threats or ["Недостатньо даних"],
        }

    def _generate_recommendations(
        self,
        company: CompanyProfile,
        competitors: list[CompetitorMatch],
        market: MarketAnalysis,
        benchmarks: list[BenchmarkResult],
    ) -> list[str]:
        """Генерувати рекомендації."""
        recommendations = []

        # На основі бенчмарків
        for b in benchmarks:
            if b.position == "laggard":
                recommendations.append(
                    f"Покращити показник {b.metric.value} - зараз у нижніх 20% ринку"
                )

        # На основі ринку
        if market.growth_trend == "growing":
            recommendations.append("Інвестувати у розширення - ринок зростає")

        # На основі конкурентів
        if competitors:
            top_competitor = competitors[0]
            if top_competitor.company.growth_rate and top_competitor.company.growth_rate > (company.growth_rate or 0):
                recommendations.append(
                    f"Вивчити стратегію {top_competitor.company.name} - вони зростають швидше"
                )

        return recommendations or ["Продовжувати моніторинг ринку"]

    async def compare_companies(
        self,
        edrpou1: str,
        edrpou2: str,
    ) -> Dict[str, Any]: # Властивості словника можуть бути довільними
        """Порівняти дві компанії."""
        company1 = self.companies_db.get(edrpou1)
        company2 = self.companies_db.get(edrpou2)

        if not company1 or not company2:
            return {"error": "Одна або обидві компанії не знайдені"}

        comparison = {
            "company1": {
                "edrpou": company1.edrpou,
                "name": company1.name,
                "revenue": company1.revenue,
                "employees": company1.employees,
                "growth_rate": company1.growth_rate,
                "market_share": company1.market_share,
                "risk_score": company1.risk_score,
            },
            "company2": {
                "edrpou": company2.edrpou,
                "name": company2.name,
                "revenue": company2.revenue,
                "employees": company2.employees,
                "growth_rate": company2.growth_rate,
                "market_share": company2.market_share,
                "risk_score": company2.risk_score,
            },
            "differences": {},
        }

        # Розраховуємо різниці
        if company1.revenue and company2.revenue:
            comparison["differences"]["revenue"] = {
                "absolute": company1.revenue - company2.revenue,
                "relative": ((company1.revenue - company2.revenue) / company2.revenue) * 100,
            }

        if company1.employees and company2.employees:
            comparison["differences"]["employees"] = {
                "absolute": company1.employees - company2.employees,
                "relative": ((company1.employees - company2.employees) / company2.employees) * 100,
            }

        return comparison
