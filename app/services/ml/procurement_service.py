"""
🛒 Procurement Intelligence Service
Predator Analytics v55.1

Відповідає на ключові бізнес-питання:
  - «Де купити дешевше?»  → аналіз цін по країнах
  - «У кого купити?»      → рейтинг постачальників
  - «Коли купити?»        → сезонний аналіз
  - «Наскільки надійний?» → scoring постачальника

Алгоритми:
  - Z-score для виявлення цінових аномалій
  - Coefficient of Variation для надійності ціни
  - Herfindahl-Hirschman Index для концентрації ринку
  - Seasonality decomposition через sliding window
"""
from __future__ import annotations

import logging
import statistics
from dataclasses import dataclass, field
from datetime import datetime, UTC
from typing import Any

import numpy as np


logger = logging.getLogger("predator.procurement")


@dataclass
class SupplierScore:
    """Скоринг постачальника за кількома факторами."""
    name: str
    edrpou: str
    country: str
    reliability_score: float      # 0–100: стабільність ціни
    volume_score: float           # 0–100: обсяг транзакцій
    price_score: float            # 0–100: ціна відносно ринку (вища = дешевше)
    total_score: float            # Зважений підсумковий бал
    avg_price_usd: float
    total_value_usd: float
    transaction_count: int
    price_volatility_pct: float   # CV цін (нижче = стабільніше)
    recommendation: str           # "рекомендовано" | "розглянути" | "обережно"


@dataclass
class CountryAnalysis:
    """Аналіз країни-постачальника."""
    country_code: str
    country_name: str
    avg_price_usd: float
    min_price_usd: float
    max_price_usd: float
    price_volatility_pct: float
    transaction_count: int
    total_value_usd: float
    active_suppliers: int
    vs_market_pct: float          # Різниця відносно ринкової середньої (від'ємне = дешевше)
    is_best_price: bool
    risk_level: str               # "low" | "medium" | "high"


@dataclass
class SeasonalityInsight:
    """Сезонна аналітика для товару."""
    product_code: str
    peak_months: list[int]        # Місяці піку попиту
    low_months: list[int]         # Місяці мінімуму
    best_buy_months: list[int]    # Оптимальні місяці для закупівлі
    seasonal_amplitude_pct: float # Амплітуда сезонних коливань
    recommendation: str


@dataclass
class ProcurementReport:
    """Повний звіт procurement intelligence."""
    product_code: str
    analysis_date: str
    market_avg_price_usd: float
    market_median_price_usd: float
    total_records: int
    countries: list[CountryAnalysis]
    top_suppliers: list[SupplierScore]
    seasonality: SeasonalityInsight | None
    best_country: str
    best_country_savings_pct: float
    market_concentration_hhi: float
    is_competitive_market: bool
    procurement_advice: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "product_code": self.product_code,
            "analysis_date": self.analysis_date,
            "market_avg_price_usd": self.market_avg_price_usd,
            "market_median_price_usd": self.market_median_price_usd,
            "total_records": self.total_records,
            "best_country": self.best_country,
            "best_country_savings_pct": self.best_country_savings_pct,
            "market_concentration": {
                "hhi": self.market_concentration_hhi,
                "is_competitive": self.is_competitive_market,
            },
            "countries": [
                {
                    "country": c.country_code,
                    "country_name": c.country_name,
                    "avg_price_usd": c.avg_price_usd,
                    "min_price_usd": c.min_price_usd,
                    "max_price_usd": c.max_price_usd,
                    "price_volatility_pct": c.price_volatility_pct,
                    "transactions": c.transaction_count,
                    "total_value_usd": c.total_value_usd,
                    "active_suppliers": c.active_suppliers,
                    "vs_market_pct": c.vs_market_pct,
                    "is_best_price": c.is_best_price,
                    "risk_level": c.risk_level,
                }
                for c in self.countries
            ],
            "top_suppliers": [
                {
                    "name": s.name,
                    "edrpou": s.edrpou,
                    "country": s.country,
                    "total_score": s.total_score,
                    "reliability_score": s.reliability_score,
                    "price_score": s.price_score,
                    "avg_price_usd": s.avg_price_usd,
                    "total_value_usd": s.total_value_usd,
                    "transactions": s.transaction_count,
                    "price_volatility_pct": s.price_volatility_pct,
                    "recommendation": s.recommendation,
                }
                for s in self.top_suppliers
            ],
            "seasonality": (
                {
                    "peak_months": self.seasonality.peak_months,
                    "low_months": self.seasonality.low_months,
                    "best_buy_months": self.seasonality.best_buy_months,
                    "seasonal_amplitude_pct": self.seasonality.seasonal_amplitude_pct,
                    "recommendation": self.seasonality.recommendation,
                }
                if self.seasonality
                else None
            ),
            "procurement_advice": self.procurement_advice,
        }


class ProcurementIntelligenceService:
    """
    Аналізує ринок постачальників для товарного коду.

    Використовує статистичні методи:
    - Нормалізація цін ($/od) для порівняння
    - Z-score для виявлення outliers
    - CV для оцінки надійності ціни
    - HHI для концентрації ринку
    """

    # Вага для підсумкового scoring постачальника
    SCORE_WEIGHTS = {
        "price": 0.40,
        "reliability": 0.35,
        "volume": 0.25,
    }

    def analyze(
        self,
        records: list[dict[str, Any]],
        product_code: str,
    ) -> ProcurementReport:
        """
        Повний procurement-аналіз на основі декларацій.

        Args:
            records: Список записів декларацій:
                     [{company_name, edrpou, value_usd, quantity, country, country_name, date, ...}]
            product_code: Код товару (для звіту)

        Returns:
            ProcurementReport з детальним аналізом.
        """
        if not records:
            return self._empty_report(product_code)

        # Розраховуємо unit_price для кожного запису
        enriched = []
        for r in records:
            q = r.get("quantity") or 1
            v = r.get("value_usd") or 0
            if v > 0 and q > 0:
                enriched.append({**r, "unit_price": v / q})

        if not enriched:
            return self._empty_report(product_code)

        all_prices = [r["unit_price"] for r in enriched]
        market_avg = sum(all_prices) / len(all_prices)
        market_median = statistics.median(all_prices) if all_prices else 0

        # Виявлення та видалення outliers (Z-score > 3)
        filtered = self._remove_outliers(enriched, "unit_price")

        # Аналіз по країнах
        countries = self._analyze_countries(filtered, market_avg)

        # Скоринг постачальників
        suppliers = self._score_suppliers(filtered, market_avg)

        # Сезонність
        seasonality = self._analyze_seasonality(filtered, product_code)

        # HHI
        hhi = self._compute_hhi(filtered)

        # Найкраща країна
        best_country = ""
        best_savings = 0.0
        if countries:
            cheapest = min(countries, key=lambda c: c.avg_price_usd or float("inf"))
            best_country = cheapest.country_code
            if market_avg > 0:
                best_savings = round((market_avg - cheapest.avg_price_usd) / market_avg * 100, 1)

        advice = self._generate_advice(
            best_country=best_country,
            savings=best_savings,
            hhi=hhi,
            seasonality=seasonality,
        )

        return ProcurementReport(
            product_code=product_code,
            analysis_date=datetime.now(UTC).isoformat(),
            market_avg_price_usd=round(market_avg, 2),
            market_median_price_usd=round(market_median, 2),
            total_records=len(enriched),
            countries=countries,
            top_suppliers=suppliers[:10],
            seasonality=seasonality,
            best_country=best_country,
            best_country_savings_pct=best_savings,
            market_concentration_hhi=round(hhi, 0),
            is_competitive_market=hhi < 2500,
            procurement_advice=advice,
        )

    # -----------------------------------------------------------------------
    # Country analysis
    # -----------------------------------------------------------------------

    def _analyze_countries(
        self,
        records: list[dict[str, Any]],
        market_avg: float,
    ) -> list[CountryAnalysis]:
        """Агрегує та аналізує дані по країнах."""
        by_country: dict[str, dict[str, Any]] = {}

        for r in records:
            c = r.get("country") or "XX"
            if not c or c == "XX":
                continue
            bucket = by_country.setdefault(c, {
                "country_code": c,
                "country_name": r.get("country_name") or c,
                "prices": [],
                "total_value": 0.0,
                "suppliers": set(),
            })
            bucket["prices"].append(r["unit_price"])
            bucket["total_value"] += r.get("value_usd", 0)
            if r.get("edrpou"):
                bucket["suppliers"].add(r["edrpou"])

        result: list[CountryAnalysis] = []
        for c, data in by_country.items():
            prices = data["prices"]
            if not prices:
                continue
            avg = sum(prices) / len(prices)
            cv = (statistics.stdev(prices) / avg * 100) if len(prices) > 1 and avg > 0 else 0
            vs_market = round((avg - market_avg) / market_avg * 100, 1) if market_avg > 0 else 0

            # Ризик країни на основі волатильності ціни
            if cv < 15:
                risk = "low"
            elif cv < 35:
                risk = "medium"
            else:
                risk = "high"

            result.append(CountryAnalysis(
                country_code=c,
                country_name=data["country_name"],
                avg_price_usd=round(avg, 2),
                min_price_usd=round(min(prices), 2),
                max_price_usd=round(max(prices), 2),
                price_volatility_pct=round(cv, 1),
                transaction_count=len(prices),
                total_value_usd=round(data["total_value"], 0),
                active_suppliers=len(data["suppliers"]),
                vs_market_pct=vs_market,
                is_best_price=False,  # заповнимо нижче
                risk_level=risk,
            ))

        # Позначаємо найдешевшу країну
        if result:
            cheapest = min(result, key=lambda x: x.avg_price_usd)
            for ca in result:
                ca.is_best_price = ca.country_code == cheapest.country_code

        return sorted(result, key=lambda x: x.avg_price_usd)

    # -----------------------------------------------------------------------
    # Supplier scoring
    # -----------------------------------------------------------------------

    def _score_suppliers(
        self,
        records: list[dict[str, Any]],
        market_avg: float,
    ) -> list[SupplierScore]:
        """Скорує постачальників за ціною, надійністю, обсягом."""
        by_supplier: dict[str, dict[str, Any]] = {}

        for r in records:
            name = r.get("company_name") or ""
            if not name:
                continue
            s = by_supplier.setdefault(name, {
                "name": name,
                "edrpou": r.get("edrpou", ""),
                "country": r.get("country", ""),
                "prices": [],
                "total_value": 0.0,
            })
            s["prices"].append(r["unit_price"])
            s["total_value"] += r.get("value_usd", 0)

        max_volume = max((s["total_value"] for s in by_supplier.values()), default=1) or 1
        scored: list[SupplierScore] = []

        for name, s in by_supplier.items():
            prices = s["prices"]
            if not prices:
                continue

            avg_price = sum(prices) / len(prices)

            # Коефіцієнт варіації (надійність ціни)
            cv = statistics.stdev(prices) / avg_price * 100 if len(prices) > 1 and avg_price > 0 else 0

            # Price score: 100 = найдешевший, 0 = найдорожчий
            price_score = 0.0
            if market_avg > 0:
                price_score = max(0, min(100, (market_avg - avg_price) / market_avg * 100 + 50))

            # Reliability score: 100 = стабільна ціна (CV=0), 0 = хаотична
            reliability_score = max(0, min(100, 100 - cv * 2))

            # Volume score: 100 = найбільший постачальник
            volume_score = s["total_value"] / max_volume * 100

            total_score = (
                price_score * self.SCORE_WEIGHTS["price"]
                + reliability_score * self.SCORE_WEIGHTS["reliability"]
                + volume_score * self.SCORE_WEIGHTS["volume"]
            )

            if total_score >= 70:
                recommendation = "рекомендовано"
            elif total_score >= 45:
                recommendation = "розглянути"
            else:
                recommendation = "обережно"

            scored.append(SupplierScore(
                name=name,
                edrpou=s["edrpou"],
                country=s["country"],
                reliability_score=round(reliability_score, 1),
                volume_score=round(volume_score, 1),
                price_score=round(price_score, 1),
                total_score=round(total_score, 1),
                avg_price_usd=round(avg_price, 2),
                total_value_usd=round(s["total_value"], 0),
                transaction_count=len(prices),
                price_volatility_pct=round(cv, 1),
                recommendation=recommendation,
            ))

        return sorted(scored, key=lambda x: -x.total_score)

    # -----------------------------------------------------------------------
    # Seasonality
    # -----------------------------------------------------------------------

    def _analyze_seasonality(
        self,
        records: list[dict[str, Any]],
        product_code: str,
    ) -> SeasonalityInsight | None:
        """Аналіз сезонності за місяцями."""
        try:
            monthly: dict[int, list[float]] = {m: [] for m in range(1, 13)}

            for r in records:
                date_str = r.get("date", "")
                if not date_str:
                    continue
                try:
                    month = int(date_str[5:7])
                    monthly[month].append(r["unit_price"])
                except (ValueError, IndexError):
                    continue

            monthly_avg: dict[int, float] = {}
            for month, prices in monthly.items():
                if prices:
                    monthly_avg[month] = sum(prices) / len(prices)

            if len(monthly_avg) < 4:
                return None

            overall_avg = sum(monthly_avg.values()) / len(monthly_avg)
            if overall_avg <= 0:
                return None

            # Нормалізуємо відносно середнього
            normalized = {m: v / overall_avg for m, v in monthly_avg.items()}

            # Піки (>110% від середнього)
            peak_months = [m for m, v in normalized.items() if v > 1.10]
            low_months = [m for m, v in normalized.items() if v < 0.90]

            # Найкраще купувати у місяці мінімальних цін
            best_buy_months = sorted(monthly_avg, key=monthly_avg.get)[:3]

            amplitude = (max(normalized.values()) - min(normalized.values())) / min(normalized.values()) * 100 if normalized else 0

            # Рекомендація
            if amplitude > 20:
                rec = (
                    f"Виражена сезонність ({amplitude:.0f}% амплітуда). "
                    f"Оптимальні місяці для закупівлі: {', '.join(_month_name(m) for m in best_buy_months[:2])}. "
                    f"Уникайте закупівель у: {', '.join(_month_name(m) for m in peak_months[:2])}."
                )
            else:
                rec = "Слабка сезонність. Час закупівлі суттєво не впливає на ціну."

            return SeasonalityInsight(
                product_code=product_code,
                peak_months=peak_months,
                low_months=low_months,
                best_buy_months=best_buy_months,
                seasonal_amplitude_pct=round(amplitude, 1),
                recommendation=rec,
            )
        except Exception as e:
            logger.warning("Seasonality analysis failed: %s", e)
            return None

    # -----------------------------------------------------------------------
    # HHI — Market Concentration
    # -----------------------------------------------------------------------

    def _compute_hhi(self, records: list[dict[str, Any]]) -> float:
        """Herfindahl-Hirschman Index для концентрації ринку."""
        volumes: dict[str, float] = {}
        for r in records:
            name = r.get("company_name") or "UNKNOWN"
            volumes[name] = volumes.get(name, 0) + r.get("value_usd", 0)

        total = sum(volumes.values()) or 1
        hhi = sum((v / total) ** 2 for v in volumes.values()) * 10000
        return round(hhi, 0)

    # -----------------------------------------------------------------------
    # Outlier removal
    # -----------------------------------------------------------------------

    def _remove_outliers(
        self,
        records: list[dict[str, Any]],
        field: str,
        z_threshold: float = 3.0,
    ) -> list[dict[str, Any]]:
        """Видаляє outliers за Z-score."""
        values = [r[field] for r in records]
        if len(values) < 5:
            return records

        try:
            mean = statistics.mean(values)
            std = statistics.stdev(values)
            if std == 0:
                return records
            return [r for r in records if abs((r[field] - mean) / std) <= z_threshold]
        except Exception:
            return records

    # -----------------------------------------------------------------------
    # Procurement advice text
    # -----------------------------------------------------------------------

    def _generate_advice(
        self,
        best_country: str,
        savings: float,
        hhi: float,
        seasonality: SeasonalityInsight | None,
    ) -> str:
        """Генерує текстову пораду щодо закупівлі."""
        parts = []

        if best_country and savings > 0:
            parts.append(
                f"Оптимальне джерело закупівлі — {best_country} "
                f"(економія {savings:.1f}% vs ринок)."
            )
        elif best_country:
            parts.append(f"Найнижча середня ціна спостерігається у постачальників з {best_country}.")

        if hhi < 1500:
            parts.append("Ринок конкурентний — торгуйтеся з кількома постачальниками одночасно.")
        elif hhi >= 4000:
            parts.append("Увага: ринок сильно концентрований — переговорна позиція слабша.")

        if seasonality and seasonality.seasonal_amplitude_pct > 20 and seasonality.best_buy_months:
            best_m = _month_name(seasonality.best_buy_months[0])
            parts.append(f"Найкращий час для закупівлі: {best_m}.")

        if not parts:
            parts.append("Недостатньо даних для конкретної поради. Завантажте митні декларації.")

        return " ".join(parts)

    # -----------------------------------------------------------------------
    # Empty report
    # -----------------------------------------------------------------------

    def _empty_report(self, product_code: str) -> ProcurementReport:
        """Порожній звіт коли даних немає."""
        return ProcurementReport(
            product_code=product_code,
            analysis_date=datetime.now(UTC).isoformat(),
            market_avg_price_usd=0,
            market_median_price_usd=0,
            total_records=0,
            countries=[],
            top_suppliers=[],
            seasonality=None,
            best_country="",
            best_country_savings_pct=0,
            market_concentration_hhi=0,
            is_competitive_market=True,
            procurement_advice=(
                "Недостатньо даних для аналізу. "
                "Завантажте митні декларації через /api/v1/ingest/ "
                "для отримання точних рекомендацій."
            ),
        )


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

_MONTH_NAMES_UK = {
    1: "Січень", 2: "Лютий", 3: "Березень",
    4: "Квітень", 5: "Травень", 6: "Червень",
    7: "Липень", 8: "Серпень", 9: "Вересень",
    10: "Жовтень", 11: "Листопад", 12: "Грудень",
}


def _month_name(month: int) -> str:
    return _MONTH_NAMES_UK.get(month, str(month))


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_service: ProcurementIntelligenceService | None = None


def get_procurement_service() -> ProcurementIntelligenceService:
    global _service
    if _service is None:
        _service = ProcurementIntelligenceService()
    return _service
