from __future__ import annotations


"""Customs Fraud Detector (COMP-269)

Виявлення шахрайських схем у митних деклараціях:
- Заниження/завищення митної вартості
- Невірна класифікація товарів (УКТЗЕД)
- Phantom shipments (фіктивні поставки)
- Round-tripping (кругові схеми)
- Transfer pricing anomalies
"""
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

import numpy as np


logger = logging.getLogger("service.customs_fraud")


@dataclass
class FraudSignal:
    """Detected customs fraud signal."""
    signal_type: str         # undervaluation, misclassification, phantom, round_trip, transfer_pricing
    severity: str            # low, medium, high, critical
    confidence: float
    declaration_id: str
    entity: str
    product_code: str
    description: str
    evidence: dict[str, Any] = field(default_factory=dict)
    recommended_action: str = ""
    detected_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "signal_type": self.signal_type,
            "severity": self.severity,
            "confidence": self.confidence,
            "declaration_id": self.declaration_id,
            "entity": self.entity,
            "product_code": self.product_code,
            "description": self.description,
            "evidence": self.evidence,
            "recommended_action": self.recommended_action,
            "detected_at": self.detected_at,
        }


class CustomsFraudDetector:
    """Detects customs fraud patterns in declarations.

    Methods:
    1. Z-score deviation analysis for prices
    2. Historical price comparison
    3. Weight/quantity anomaly detection
    4. Known scheme pattern matching
    """

    def __init__(
        self,
        price_deviation_threshold: float = 3.0,
        quantity_deviation_threshold: float = 2.5,
    ):
        self.price_deviation_threshold = price_deviation_threshold
        self.quantity_deviation_threshold = quantity_deviation_threshold
        # Market reference prices (would come from DB in production)
        self._ref_prices: dict[str, float] = {}
        logger.info("CustomsFraudDetector initialized")

    def analyze_declaration(
        self,
        declaration: dict[str, Any],
        market_prices: dict[str, float] | None = None,
        historical: list[dict] | None = None,
    ) -> list[FraudSignal]:
        """Analyze a customs declaration for fraud signals.

        Args:
            declaration: Dict with keys:
                - declaration_id, entity, product_code, product_name
                - declared_value, quantity, weight_kg
                - country_origin, country_destination
                - unit_price (calculated from value/quantity)
            market_prices: Reference prices by product code
            historical: Previous declarations for comparison

        Returns:
            List of FraudSignal
        """
        signals: list[FraudSignal] = []

        # 1. Price deviation analysis
        price_signals = self._check_price_deviation(declaration, market_prices)
        signals.extend(price_signals)

        # 2. Weight/quantity anomaly
        qty_signals = self._check_quantity_anomaly(declaration, historical)
        signals.extend(qty_signals)

        # 3. Classification check
        class_signals = self._check_misclassification(declaration)
        signals.extend(class_signals)

        # 4. Round-tripping check
        rt_signals = self._check_round_tripping(declaration, historical)
        signals.extend(rt_signals)

        logger.debug(
            "Analyzed declaration %s: %d signals",
            declaration.get("declaration_id", "?"), len(signals),
        )
        return signals

    def analyze_batch(
        self,
        declarations: list[dict[str, Any]],
        market_prices: dict[str, float] | None = None,
    ) -> list[FraudSignal]:
        """Analyze batch of declarations."""
        all_signals = []
        for decl in declarations:
            signals = self.analyze_declaration(decl, market_prices, declarations)
            all_signals.extend(signals)
        return all_signals

    # --- Detection Methods ---

    def _check_price_deviation(
        self,
        decl: dict[str, Any],
        market_prices: dict[str, float] | None,
    ) -> list[FraudSignal]:
        """Check if declared price deviates from market reference."""
        signals = []

        unit_price = decl.get("unit_price", 0)
        product_code = decl.get("product_code", "")
        quantity = decl.get("quantity", 0)

        if unit_price <= 0 or not product_code:
            return signals

        # Get reference price
        ref_price = None
        if market_prices:
            ref_price = market_prices.get(product_code)
        if ref_price is None:
            ref_price = self._ref_prices.get(product_code)

        if ref_price and ref_price > 0:
            deviation = (unit_price - ref_price) / ref_price

            # Undervaluation (significantly below market)
            if deviation < -0.5:
                severity = "critical" if deviation < -0.7 else "high"
                signals.append(FraudSignal(
                    signal_type="undervaluation",
                    severity=severity,
                    confidence=min(0.95, abs(deviation)),
                    declaration_id=decl.get("declaration_id", ""),
                    entity=decl.get("entity", ""),
                    product_code=product_code,
                    description=(
                        f"Заявлена ціна {unit_price:.2f} на {abs(deviation*100):.0f}% "
                        f"нижче ринкової ({ref_price:.2f})"
                    ),
                    evidence={
                        "declared_price": unit_price,
                        "reference_price": ref_price,
                        "deviation_pct": round(deviation * 100, 1),
                    },
                    recommended_action="Потребує перевірки митної вартості",
                ))

            # Overvaluation (possibly for capital flight)
            elif deviation > 1.0:
                signals.append(FraudSignal(
                    signal_type="overvaluation",
                    severity="high",
                    confidence=min(0.85, deviation / 3),
                    declaration_id=decl.get("declaration_id", ""),
                    entity=decl.get("entity", ""),
                    product_code=product_code,
                    description=(
                        f"Заявлена ціна {unit_price:.2f} на {deviation*100:.0f}% "
                        f"вище ринкової ({ref_price:.2f}) — можливий вивід капіталу"
                    ),
                    evidence={
                        "declared_price": unit_price,
                        "reference_price": ref_price,
                        "deviation_pct": round(deviation * 100, 1),
                    },
                    recommended_action="Перевірити обґрунтування ціни",
                ))

        return signals

    def _check_quantity_anomaly(
        self,
        decl: dict[str, Any],
        historical: list[dict] | None,
    ) -> list[FraudSignal]:
        """Check weight/quantity anomalies."""
        signals = []

        weight = decl.get("weight_kg", 0)
        quantity = decl.get("quantity", 0)

        if weight <= 0 or quantity <= 0:
            return signals

        weight_per_unit = weight / quantity

        # Compare with historical for same product
        if historical:
            same_product = [
                h for h in historical
                if h.get("product_code") == decl.get("product_code")
                and h.get("weight_kg", 0) > 0
                and h.get("quantity", 0) > 0
                and h.get("declaration_id") != decl.get("declaration_id")
            ]

            if len(same_product) >= 3:
                hist_weights = [h["weight_kg"] / h["quantity"] for h in same_product]
                mean_wpq = np.mean(hist_weights)
                std_wpq = np.std(hist_weights)

                if std_wpq > 0:
                    z_score = (weight_per_unit - mean_wpq) / std_wpq

                    if abs(z_score) > self.quantity_deviation_threshold:
                        signals.append(FraudSignal(
                            signal_type="weight_anomaly",
                            severity="medium" if abs(z_score) < 4 else "high",
                            confidence=min(0.9, abs(z_score) / 5),
                            declaration_id=decl.get("declaration_id", ""),
                            entity=decl.get("entity", ""),
                            product_code=decl.get("product_code", ""),
                            description=(
                                f"Аномальна вага: {weight_per_unit:.2f} кг/од "
                                f"(середня: {mean_wpq:.2f}, z={z_score:.1f})"
                            ),
                            evidence={
                                "weight_per_unit": round(weight_per_unit, 2),
                                "historical_mean": round(mean_wpq, 2),
                                "z_score": round(z_score, 2),
                            },
                            recommended_action="Фізична перевірка вантажу",
                        ))

        return signals

    def _check_misclassification(
        self, decl: dict[str, Any]
    ) -> list[FraudSignal]:
        """Check for potential product misclassification."""
        signals = []

        product_code = decl.get("product_code", "")
        product_name = decl.get("product_name", "").lower()

        if not product_code or not product_name:
            return signals

        # Known problematic classifications (simplified rules)
        suspicious_patterns = [
            {"code_prefix": "8471", "expected_words": ["комп'ютер", "процесор", "ноутбук"],
             "suspicious_words": ["телефон", "смартфон"]},
            {"code_prefix": "2710", "expected_words": ["нафтопродукт", "паливо", "бензин"],
             "suspicious_words": ["мастило", "розчинник"]},
            {"code_prefix": "6403", "expected_words": ["взуття", "черевики"],
             "suspicious_words": ["тканина", "одяг"]},
        ]

        for pattern in suspicious_patterns:
            if product_code.startswith(pattern["code_prefix"]):
                has_suspicious = any(w in product_name for w in pattern["suspicious_words"])
                has_expected = any(w in product_name for w in pattern["expected_words"])

                if has_suspicious and not has_expected:
                    signals.append(FraudSignal(
                        signal_type="misclassification",
                        severity="medium",
                        confidence=0.6,
                        declaration_id=decl.get("declaration_id", ""),
                        entity=decl.get("entity", ""),
                        product_code=product_code,
                        description=(
                            f"Можлива невірна класифікація: код {product_code} "
                            f"не відповідає опису '{product_name[:50]}'"
                        ),
                        evidence={
                            "product_code": product_code,
                            "product_name": product_name[:100],
                        },
                        recommended_action="Перевірити відповідність коду товару",
                    ))

        return signals

    def _check_round_tripping(
        self,
        decl: dict[str, Any],
        historical: list[dict] | None,
    ) -> list[FraudSignal]:
        """Detect round-tripping patterns (export→import same goods)."""
        signals = []

        if not historical:
            return signals

        entity = decl.get("entity", "")
        product_code = decl.get("product_code", "")

        # Look for same entity, same product, opposite direction
        for h in historical:
            if (
                h.get("entity") == entity
                and h.get("product_code") == product_code
                and h.get("declaration_id") != decl.get("declaration_id")
                and h.get("direction") != decl.get("direction")
            ):
                signals.append(FraudSignal(
                    signal_type="round_tripping",
                    severity="high",
                    confidence=0.7,
                    declaration_id=decl.get("declaration_id", ""),
                    entity=entity,
                    product_code=product_code,
                    description=(
                        f"Можливий round-tripping: {entity} імпортує/експортує "
                        f"однаковий товар ({product_code})"
                    ),
                    evidence={
                        "matching_declaration": h.get("declaration_id", ""),
                        "directions": [decl.get("direction"), h.get("direction")],
                    },
                    recommended_action="Дослідити логістичний ланцюг",
                ))
                break

        return signals


# Singleton
customs_fraud_detector = CustomsFraudDetector()
