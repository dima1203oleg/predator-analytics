from __future__ import annotations

"""CERS — Composite Entity Risk Score Engine (COMP-066)

Обчислює композитний ризик-бал (0-100) для компаній та фізосіб на основі:
- Судові позови (court_cases_count)
- Офшорні зв'язки (offshore_connections)
- Зміна виручки (revenue_change_pct)
- Санкційний статус (sanctions_status)
- Затримки платежів (payment_delay_days)
- Кількість пов'язаних осіб у реєстрі (pep_connections)
- ProZorro порушення (prozorro_violations)
"""
from dataclasses import dataclass, field
from datetime import UTC, datetime
import logging
from typing import Any

logger = logging.getLogger("service.cers")


# Weight configuration for each factor
DEFAULT_WEIGHTS = {
    "court_cases_count": 0.20,
    "offshore_connections": 0.20,
    "revenue_change_pct": 0.15,
    "sanctions_status": 0.15,
    "payment_delay_days": 0.10,
    "pep_connections": 0.10,
    "prozorro_violations": 0.10,
}


@dataclass
class CERSFactor:
    """A single risk factor contributing to the CERS score."""

    name: str
    value: Any
    weight: float
    contribution: float  # Points contributed to total score (0-100 scale)
    unit: str | None = None


@dataclass
class CERSResult:
    """Composite Entity Risk Score result."""

    ueid: str
    cers_score: int  # 0–100
    risk_level: str  # low, medium, high, critical
    risk_category: str  # financial, legal, sanctions, operational
    factors: list[CERSFactor] = field(default_factory=list)
    shap_explanation: dict | None = None
    computed_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    model_version: str = "cers-v1.0.0"
    data_sources: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "ueid": self.ueid,
            "cers_score": self.cers_score,
            "risk_level": self.risk_level,
            "risk_category": self.risk_category,
            "factors": [
                {
                    "name": f.name,
                    "value": f.value,
                    "weight": f.weight,
                    "contribution": f.contribution,
                    "unit": f.unit,
                }
                for f in self.factors
            ],
            "computed_at": self.computed_at.isoformat(),
            "model_version": self.model_version,
            "data_sources": self.data_sources,
        }


class CERSEngine:
    """Composite Entity Risk Score Engine.

    Calculates risk scores for entities using weighted factor analysis.
    Supports SHAP-like explanations of each factor's contribution.
    """

    def __init__(self, weights: dict[str, float] | None = None):
        self.weights = weights or DEFAULT_WEIGHTS
        logger.info("CERS Engine initialized with %d factors", len(self.weights))

    def compute(
        self,
        ueid: str,
        entity_data: dict[str, Any],
        data_sources: list[str] | None = None,
    ) -> CERSResult:
        """Compute CERS score for an entity.

        Args:
            ueid: Unique Economic ID of the entity
            entity_data: Dictionary of factor values, e.g.:
                {
                    "court_cases_count": 5,
                    "offshore_connections": 2,
                    "revenue_change_pct": -40,
                    "sanctions_status": "none",  # none, watchlist, sanctioned
                    "payment_delay_days": 30,
                    "pep_connections": 1,
                    "prozorro_violations": 0,
                }
            data_sources: List of data source identifiers used

        Returns:
            CERSResult with score, level, factors, and explanations

        """
        factors: list[CERSFactor] = []
        total_score = 0.0

        for factor_name, weight in self.weights.items():
            raw_value = entity_data.get(factor_name, 0)
            normalized = self._normalize_factor(factor_name, raw_value)
            contribution = round(normalized * weight * 100, 1)
            total_score += contribution

            factors.append(CERSFactor(
                name=self._factor_label(factor_name),
                value=raw_value,
                weight=weight,
                contribution=contribution,
                unit=self._factor_unit(factor_name),
            ))

        # Clamp 0–100
        cers_score = max(0, min(100, round(total_score)))

        # Determine risk level
        risk_level = self._risk_level(cers_score)

        # Determine dominant category
        risk_category = self._dominant_category(factors)

        logger.info("CERS computed for %s: score=%d, level=%s", ueid, cers_score, risk_level)

        return CERSResult(
            ueid=ueid,
            cers_score=cers_score,
            risk_level=risk_level,
            risk_category=risk_category,
            factors=factors,
            data_sources=data_sources or [],
        )

    # --- Internal normalizers (0.0 – 1.0) ---

    def _normalize_factor(self, name: str, value: Any) -> float:
        """Normalize raw factor value to 0.0-1.0 range."""
        if name == "court_cases_count":
            # 0 cases = 0.0, 10+ = 1.0
            return min(float(value) / 10.0, 1.0)

        if name == "offshore_connections":
            # 0 = 0.0, 5+ = 1.0
            return min(float(value) / 5.0, 1.0)

        if name == "revenue_change_pct":
            # Positive change = low risk, negative = high risk
            # -100% = 1.0, 0% = 0.5, +100% = 0.0
            pct = float(value)
            return max(0.0, min(1.0, 0.5 - pct / 200.0))

        if name == "sanctions_status":
            status_map = {"none": 0.0, "watchlist": 0.5, "sanctioned": 1.0}
            return status_map.get(str(value).lower(), 0.0)

        if name == "payment_delay_days":
            # 0 days = 0.0, 90+ = 1.0
            return min(float(value) / 90.0, 1.0)

        if name == "pep_connections":
            # 0 = 0.0, 5+ = 1.0
            return min(float(value) / 5.0, 1.0)

        if name == "prozorro_violations":
            # 0 = 0.0, 3+ = 1.0
            return min(float(value) / 3.0, 1.0)

        # Unknown factor — assume moderate risk
        return 0.5

    def _risk_level(self, score: int) -> str:
        if score >= 75:
            return "critical"
        if score >= 50:
            return "high"
        if score >= 25:
            return "medium"
        return "low"

    def _dominant_category(self, factors: list[CERSFactor]) -> str:
        """Determine the primary risk category."""
        category_map = {
            "Судові позови": "legal",
            "Зв'язки з офшорами": "financial",
            "Зміна виручки": "financial",
            "Санкційний статус": "sanctions",
            "Затримки платежів": "operational",
            "PEP-зв'язки": "compliance",
            "Порушення ProZorro": "compliance",
        }
        max_factor = max(factors, key=lambda f: f.contribution)
        return category_map.get(max_factor.name, "general")

    def _factor_label(self, name: str) -> str:
        labels = {
            "court_cases_count": "Судові позови",
            "offshore_connections": "Зв'язки з офшорами",
            "revenue_change_pct": "Зміна виручки",
            "sanctions_status": "Санкційний статус",
            "payment_delay_days": "Затримки платежів",
            "pep_connections": "PEP-зв'язки",
            "prozorro_violations": "Порушення ProZorro",
        }
        return labels.get(name, name)

    def _factor_unit(self, name: str) -> str | None:
        units = {
            "revenue_change_pct": "percent",
            "payment_delay_days": "days",
        }
        return units.get(name)


# Singleton
_cers_engine: CERSEngine | None = None


def get_cers_engine() -> CERSEngine:
    """Get CERS engine singleton."""
    global _cers_engine
    if _cers_engine is None:
        _cers_engine = CERSEngine()
    return _cers_engine
