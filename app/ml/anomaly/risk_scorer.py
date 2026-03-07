"""
🧮 Ризик-скорер — PREDATOR Analytics v4.1.

Розраховує комплексний ризик-бал для компаній
на основі множини факторів.

Типове використання:
    scorer = RiskScorer()
    score = await scorer.score_company(edrpou="12345678")
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


@dataclass
class RiskBreakdown:
    """Розбивка ризик-балу по категоріях."""

    sanctions_risk: float = 0.0     # 0-100
    financial_risk: float = 0.0     # 0-100
    anomaly_risk: float = 0.0       # 0-100
    connection_risk: float = 0.0    # 0-100
    compliance_risk: float = 0.0    # 0-100


@dataclass
class RiskResult:
    """Результат оцінки ризику."""

    edrpou: str
    company_name: str
    total_score: float  # 0-100
    risk_level: str     # low, medium, high, critical
    breakdown: RiskBreakdown = field(default_factory=RiskBreakdown)
    flags: list[str] = field(default_factory=list)
    recommendation_uk: str = ""


class RiskScorer:
    """
    Комплексний скорер ризиків для компаній.

    Враховує:
    - Санкційний статус (РНБО, EU, OFAC)
    - Фінансові аномалії
    - Підозрілі зв'язки (PEP, офшори)
    - Відповідність нормативним вимогам
    """

    # Ваги для кожної категорії ризику
    WEIGHTS: dict[str, float] = {
        "sanctions": 0.35,
        "financial": 0.25,
        "anomaly": 0.20,
        "connection": 0.10,
        "compliance": 0.10,
    }

    # Межі рівнів ризику
    THRESHOLDS: dict[str, float] = {
        "low": 25.0,
        "medium": 50.0,
        "high": 75.0,
        "critical": 100.0,
    }

    async def score_company(
        self,
        edrpou: str,
        company_data: dict[str, Any] | None = None,
    ) -> RiskResult:
        """
        Розрахунок ризик-балу для компанії.

        Args:
            edrpou: Код ЄДРПОУ
            company_data: Додаткові дані (якщо вже є)

        Returns:
            RiskResult з повною оцінкою
        """
        logger.info("Розрахунок ризику", edrpou=edrpou)

        # TODO: Отримати дані з БД та зовнішніх реєстрів
        breakdown = RiskBreakdown(
            sanctions_risk=0.0,
            financial_risk=15.5,
            anomaly_risk=20.0,
            connection_risk=5.0,
            compliance_risk=10.0,
        )

        total = self._calculate_total(breakdown)
        level = self._get_level(total)
        flags = self._generate_flags(breakdown)

        return RiskResult(
            edrpou=edrpou,
            company_name=company_data.get("name", f"Компанія {edrpou}") if company_data else f"Компанія {edrpou}",
            total_score=round(total, 1),
            risk_level=level,
            breakdown=breakdown,
            flags=flags,
            recommendation_uk=self._generate_recommendation(level),
        )

    def _calculate_total(self, breakdown: RiskBreakdown) -> float:
        """Зважений підсумок ризик-балу."""
        return (
            breakdown.sanctions_risk * self.WEIGHTS["sanctions"]
            + breakdown.financial_risk * self.WEIGHTS["financial"]
            + breakdown.anomaly_risk * self.WEIGHTS["anomaly"]
            + breakdown.connection_risk * self.WEIGHTS["connection"]
            + breakdown.compliance_risk * self.WEIGHTS["compliance"]
        )

    def _get_level(self, score: float) -> str:
        """Рівень ризику за балом."""
        if score < self.THRESHOLDS["low"]:
            return "low"
        elif score < self.THRESHOLDS["medium"]:
            return "medium"
        elif score < self.THRESHOLDS["high"]:
            return "high"
        return "critical"

    @staticmethod
    def _generate_flags(breakdown: RiskBreakdown) -> list[str]:
        """Генерація прапорців ризику."""
        flags: list[str] = []
        if breakdown.sanctions_risk > 0:
            flags.append("⚠️ Санкційний ризик")
        if breakdown.financial_risk > 30:
            flags.append("💰 Фінансовий ризик")
        if breakdown.anomaly_risk > 40:
            flags.append("🔍 Виявлені аномалії")
        if breakdown.connection_risk > 20:
            flags.append("🔗 Підозрілі зв'язки")
        return flags

    @staticmethod
    def _generate_recommendation(level: str) -> str:
        """Генерація рекомендації українською."""
        recommendations: dict[str, str] = {
            "low": "Компанія має низький рівень ризику. Стандартна процедура.",
            "medium": "Рекомендовано додаткову перевірку фінансових показників.",
            "high": "Потрібен повний Due Diligence. Залучити відділ комплаєнсу.",
            "critical": "УВАГА! Негайна перевірка. Можливі санкційні порушення.",
        }
        return recommendations.get(level, "Дані недостатні для оцінки.")
