from __future__ import annotations


"""Default Predictor (COMP-067)

Прогнозування дефолту/банкрутства компаній.
Використовує:
- Altman Z-score (класичний)
- Modified Z-score для не-публічних компаній
- ML-enhanced scoring з додатковими фічами
"""
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


logger = logging.getLogger("service.default_predictor")


@dataclass
class DefaultPrediction:
    """Default/bankruptcy prediction result."""
    ueid: str
    company_name: str
    z_score: float
    risk_zone: str            # safe, grey, distress
    probability_of_default: float  # 0.0 - 1.0
    contributing_factors: list[dict[str, Any]] = field(default_factory=list)
    recommendation: str = ""
    model_version: str = "altman-z-v1"
    predicted_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "ueid": self.ueid,
            "company_name": self.company_name,
            "z_score": round(self.z_score, 3),
            "risk_zone": self.risk_zone,
            "probability_of_default": round(self.probability_of_default, 3),
            "contributing_factors": self.contributing_factors,
            "recommendation": self.recommendation,
            "model_version": self.model_version,
            "predicted_at": self.predicted_at,
        }


class DefaultPredictor:
    """Bankruptcy/default prediction using Altman Z-score variants.

    Models:
    1. Original Altman Z-score (for public manufacturing companies)
    2. Z'-score (for private companies)
    3. Z''-score (for non-manufacturing/emerging markets)
    """

    def __init__(self):
        logger.info("DefaultPredictor initialized")

    def predict(
        self,
        ueid: str,
        company_name: str,
        financials: dict[str, float],
        is_public: bool = False,
        is_manufacturing: bool = True,
    ) -> DefaultPrediction:
        """Predict default probability.

        Args:
            ueid: Unified Economic ID
            company_name: Company name
            financials: Financial data with keys:
                - total_assets: Total assets
                - total_liabilities: Total liabilities
                - current_assets: Current assets
                - current_liabilities: Current liabilities
                - retained_earnings: Retained earnings
                - ebit: Earnings before interest and taxes
                - revenue: Total revenue
                - market_value_equity: Market cap (for public) or book equity
                - working_capital: (optional, calculated if missing)
            is_public: Whether stock is publicly traded
            is_manufacturing: Whether manufacturing company

        Returns:
            DefaultPrediction
        """
        total_assets = financials.get("total_assets", 0)

        if total_assets <= 0:
            return DefaultPrediction(
                ueid=ueid,
                company_name=company_name,
                z_score=0.0,
                risk_zone="distress",
                probability_of_default=0.99,
                recommendation="Дані недостатні або компанія має нульові активи",
            )

        # Select appropriate Z-score model
        if is_public and is_manufacturing:
            z_score, factors = self._altman_z_original(financials)
        elif not is_public:
            z_score, factors = self._altman_z_private(financials)
        else:
            z_score, factors = self._altman_z_emerging(financials)

        # Classify risk zone
        risk_zone = self._classify_risk(z_score, is_public)

        # Convert to probability
        pd = self._z_to_probability(z_score)

        # Generate recommendation
        recommendation = self._generate_recommendation(risk_zone, factors)

        return DefaultPrediction(
            ueid=ueid,
            company_name=company_name,
            z_score=z_score,
            risk_zone=risk_zone,
            probability_of_default=pd,
            contributing_factors=factors,
            recommendation=recommendation,
        )

    # --- Altman Z-score variants ---

    def _altman_z_original(
        self, f: dict[str, float]
    ) -> tuple[float, list[dict]]:
        """Original Altman Z-score (public manufacturing).

        Z = 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4 + 1.0*X5
        """
        ta = f.get("total_assets", 1)
        wc = f.get("working_capital", f.get("current_assets", 0) - f.get("current_liabilities", 0))
        re = f.get("retained_earnings", 0)
        ebit = f.get("ebit", 0)
        mve = f.get("market_value_equity", f.get("total_assets", 0) - f.get("total_liabilities", 0))
        tl = f.get("total_liabilities", 1)
        rev = f.get("revenue", 0)

        x1 = wc / ta if ta else 0
        x2 = re / ta if ta else 0
        x3 = ebit / ta if ta else 0
        x4 = mve / tl if tl else 0
        x5 = rev / ta if ta else 0

        z = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 1.0 * x5

        factors = [
            {"name": "X1 (Working Capital / TA)", "value": round(x1, 3), "weight": 1.2, "contribution": round(1.2 * x1, 3)},
            {"name": "X2 (Retained Earnings / TA)", "value": round(x2, 3), "weight": 1.4, "contribution": round(1.4 * x2, 3)},
            {"name": "X3 (EBIT / TA)", "value": round(x3, 3), "weight": 3.3, "contribution": round(3.3 * x3, 3)},
            {"name": "X4 (Equity / TL)", "value": round(x4, 3), "weight": 0.6, "contribution": round(0.6 * x4, 3)},
            {"name": "X5 (Revenue / TA)", "value": round(x5, 3), "weight": 1.0, "contribution": round(1.0 * x5, 3)},
        ]

        return z, factors

    def _altman_z_private(
        self, f: dict[str, float]
    ) -> tuple[float, list[dict]]:
        """Altman Z'-score for private companies.

        Z' = 0.717*X1 + 0.847*X2 + 3.107*X3 + 0.42*X4 + 0.998*X5
        X4 = Book Value of Equity / Total Liabilities
        """
        ta = f.get("total_assets", 1)
        wc = f.get("working_capital", f.get("current_assets", 0) - f.get("current_liabilities", 0))
        re = f.get("retained_earnings", 0)
        ebit = f.get("ebit", 0)
        bve = f.get("total_assets", 0) - f.get("total_liabilities", 0)
        tl = f.get("total_liabilities", 1)
        rev = f.get("revenue", 0)

        x1 = wc / ta if ta else 0
        x2 = re / ta if ta else 0
        x3 = ebit / ta if ta else 0
        x4 = bve / tl if tl else 0
        x5 = rev / ta if ta else 0

        z = 0.717 * x1 + 0.847 * x2 + 3.107 * x3 + 0.42 * x4 + 0.998 * x5

        factors = [
            {"name": "X1 (WC/TA)", "value": round(x1, 3), "weight": 0.717, "contribution": round(0.717 * x1, 3)},
            {"name": "X2 (RE/TA)", "value": round(x2, 3), "weight": 0.847, "contribution": round(0.847 * x2, 3)},
            {"name": "X3 (EBIT/TA)", "value": round(x3, 3), "weight": 3.107, "contribution": round(3.107 * x3, 3)},
            {"name": "X4 (BVE/TL)", "value": round(x4, 3), "weight": 0.42, "contribution": round(0.42 * x4, 3)},
            {"name": "X5 (Rev/TA)", "value": round(x5, 3), "weight": 0.998, "contribution": round(0.998 * x5, 3)},
        ]

        return z, factors

    def _altman_z_emerging(
        self, f: dict[str, float]
    ) -> tuple[float, list[dict]]:
        """Altman Z''-score for emerging markets (no X5).

        Z'' = 6.56*X1 + 3.26*X2 + 6.72*X3 + 1.05*X4 + 3.25
        """
        ta = f.get("total_assets", 1)
        wc = f.get("working_capital", f.get("current_assets", 0) - f.get("current_liabilities", 0))
        re = f.get("retained_earnings", 0)
        ebit = f.get("ebit", 0)
        bve = f.get("total_assets", 0) - f.get("total_liabilities", 0)
        tl = f.get("total_liabilities", 1)

        x1 = wc / ta if ta else 0
        x2 = re / ta if ta else 0
        x3 = ebit / ta if ta else 0
        x4 = bve / tl if tl else 0

        z = 6.56 * x1 + 3.26 * x2 + 6.72 * x3 + 1.05 * x4 + 3.25

        factors = [
            {"name": "X1 (WC/TA)", "value": round(x1, 3), "weight": 6.56, "contribution": round(6.56 * x1, 3)},
            {"name": "X2 (RE/TA)", "value": round(x2, 3), "weight": 3.26, "contribution": round(3.26 * x2, 3)},
            {"name": "X3 (EBIT/TA)", "value": round(x3, 3), "weight": 6.72, "contribution": round(6.72 * x3, 3)},
            {"name": "X4 (BVE/TL)", "value": round(x4, 3), "weight": 1.05, "contribution": round(1.05 * x4, 3)},
            {"name": "Constant", "value": 3.25, "weight": 1.0, "contribution": 3.25},
        ]

        return z, factors

    def _classify_risk(self, z: float, is_public: bool) -> str:
        """Classify into risk zone."""
        if is_public:
            if z > 2.99:
                return "safe"
            elif z > 1.81:
                return "grey"
            else:
                return "distress"
        else:
            # Z'-score thresholds
            if z > 2.90:
                return "safe"
            elif z > 1.23:
                return "grey"
            else:
                return "distress"

    def _z_to_probability(self, z: float) -> float:
        """Convert Z-score to probability of default (logistic)."""
        import math
        # Logistic transformation: PD = 1 / (1 + e^(3.0 * z - 5.0))
        try:
            pd = 1.0 / (1.0 + math.exp(3.0 * z - 5.0))
        except OverflowError:
            pd = 0.0 if z > 0 else 1.0
        return round(min(0.99, max(0.01, pd)), 3)

    def _generate_recommendation(
        self, zone: str, factors: list[dict]
    ) -> str:
        """Generate Ukrainian-language recommendation."""
        if zone == "safe":
            return "Компанія у безпечній зоні. Ризик банкрутства мінімальний."
        elif zone == "grey":
            weak = [f["name"] for f in factors if f.get("contribution", 0) < 0]
            if weak:
                return f"Сіра зона. Потребує уваги: {', '.join(weak)}. Рекомендовано поглиблений аналіз."
            return "Сіра зона. Рекомендовано моніторинг фінансових показників."
        else:
            critical = sorted(factors, key=lambda f: f.get("contribution", 0))[:2]
            names = [c["name"] for c in critical]
            return f"УВАГА: Зона фінансового стресу. Критичні фактори: {', '.join(names)}. Висока ймовірність дефолту."


# Singleton
default_predictor = DefaultPredictor()
