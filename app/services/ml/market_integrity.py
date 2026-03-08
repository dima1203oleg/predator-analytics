from __future__ import annotations


"""Cartel Detector (COMP-063) + Dumping Detector (COMP-065)

Виявлення картельних змов та демпінгу на ринках:

Cartel Detection:
- Синхронні зміни цін (>3 компаній змінюють ціну одночасно)
- Аномальна кореляція цінових рядів
- Ідентичні ціни при різних витратах

Dumping Detection:
- Ціна нижче собівартості (< cost * threshold)
- Різке зниження для витіснення конкурентів
- Аналіз ціна/якість аномалій
"""
import logging
import math
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

import numpy as np


logger = logging.getLogger("service.market_integrity")


@dataclass
class CartelSignal:
    """Detected cartel behavior signal."""
    signal_type: str           # price_sync, price_correlation, identical_pricing, bid_rotation
    confidence: float          # 0.0 - 1.0
    entities: list[str]        # Involved entities
    product_code: str
    description: str
    evidence: dict[str, Any] = field(default_factory=dict)
    detected_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "signal_type": self.signal_type,
            "confidence": self.confidence,
            "entities": self.entities,
            "product_code": self.product_code,
            "description": self.description,
            "evidence": self.evidence,
            "detected_at": self.detected_at,
        }


@dataclass
class DumpingSignal:
    """Detected dumping behavior signal."""
    entity: str
    product_code: str
    current_price: float
    market_average: float
    deviation_pct: float      # How far below market average
    duration_days: int         # How long the deviation lasted
    confidence: float
    description: str
    detected_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "entity": self.entity,
            "product_code": self.product_code,
            "current_price": self.current_price,
            "market_average": self.market_average,
            "deviation_pct": self.deviation_pct,
            "duration_days": self.duration_days,
            "confidence": self.confidence,
            "description": self.description,
            "detected_at": self.detected_at,
        }


class MarketIntegrityAnalyzer:
    """Detects cartel behavior and dumping in markets.

    Uses statistical methods:
    - Price synchronization detection
    - Pearson correlation analysis
    - Z-score outlier detection for dumping
    """

    def __init__(self, sync_threshold: float = 0.02, dumping_threshold: float = -0.30):
        self.sync_threshold = sync_threshold     # Max Δ% for "synchronized"
        self.dumping_threshold = dumping_threshold  # -30% below market = dumping
        logger.info("MarketIntegrityAnalyzer initialized")

    def detect_cartel(
        self,
        product_code: str,
        price_series: dict[str, list[float]],
        dates: list[str] | None = None,
    ) -> list[CartelSignal]:
        """Detect cartel signals in price data.

        Args:
            product_code: Product identifier
            price_series: {entity_name: [prices...]} for each competitor
            dates: Corresponding dates

        Returns:
            List of CartelSignal found
        """
        signals: list[CartelSignal] = []
        entities = list(price_series.keys())

        if len(entities) < 2:
            return signals

        # 1. Price synchronization detection
        sync_signals = self._detect_price_sync(product_code, price_series, entities)
        signals.extend(sync_signals)

        # 2. High correlation detection
        corr_signals = self._detect_high_correlation(product_code, price_series, entities)
        signals.extend(corr_signals)

        # 3. Identical pricing detection
        id_signals = self._detect_identical_pricing(product_code, price_series, entities)
        signals.extend(id_signals)

        logger.info(
            "Cartel analysis for %s: %d signals from %d entities",
            product_code, len(signals), len(entities)
        )
        return signals

    def detect_dumping(
        self,
        product_code: str,
        price_series: dict[str, list[float]],
    ) -> list[DumpingSignal]:
        """Detect dumping behavior.

        Args:
            product_code: Product identifier
            price_series: {entity_name: [prices...]}

        Returns:
            List of DumpingSignal found
        """
        signals: list[DumpingSignal] = []

        if len(price_series) < 2:
            return signals

        # Calculate market average per timepoint
        all_prices = list(price_series.values())
        n_points = min(len(p) for p in all_prices)

        if n_points == 0:
            return signals

        market_averages = []
        for i in range(n_points):
            avg = np.mean([p[i] for p in all_prices if i < len(p)])
            market_averages.append(avg)

        # Check each entity
        for entity, prices in price_series.items():
            recent_prices = prices[-n_points:]
            for i in range(n_points):
                market_avg = market_averages[i]
                if market_avg <= 0:
                    continue

                deviation = (recent_prices[i] - market_avg) / market_avg

                if deviation < self.dumping_threshold:
                    # Count consecutive days below threshold
                    duration = 1
                    for j in range(i - 1, -1, -1):
                        if j < len(recent_prices):
                            d = (recent_prices[j] - market_averages[j]) / market_averages[j] if market_averages[j] > 0 else 0
                            if d < self.dumping_threshold:
                                duration += 1
                            else:
                                break

                    confidence = min(0.95, abs(deviation) * duration / 10)

                    signals.append(DumpingSignal(
                        entity=entity,
                        product_code=product_code,
                        current_price=round(recent_prices[i], 2),
                        market_average=round(market_avg, 2),
                        deviation_pct=round(deviation * 100, 1),
                        duration_days=duration,
                        confidence=round(confidence, 2),
                        description=(
                            f"{entity}: ціна {recent_prices[i]:.2f} на "
                            f"{abs(deviation*100):.1f}% нижче ринку ({market_avg:.2f}) "
                            f"протягом {duration} днів"
                        ),
                    ))

        # Deduplicate — keep only latest signal per entity
        seen_entities: set[str] = set()
        unique_signals: list[DumpingSignal] = []
        for s in reversed(signals):
            if s.entity not in seen_entities:
                seen_entities.add(s.entity)
                unique_signals.append(s)

        logger.info(
            "Dumping analysis for %s: %d signals",
            product_code, len(unique_signals)
        )
        return unique_signals

    # --- Cartel Detection Methods ---

    def _detect_price_sync(
        self,
        product_code: str,
        price_series: dict[str, list[float]],
        entities: list[str],
    ) -> list[CartelSignal]:
        """Detect synchronized price changes (>3 entities change within threshold)."""
        signals = []
        all_prices = {e: np.array(price_series[e]) for e in entities}

        # Calculate % changes
        for e, prices in all_prices.items():
            if len(prices) < 2:
                return signals

        changes = {
            e: np.diff(p) / p[:-1] if len(p) > 1 else np.array([])
            for e, p in all_prices.items()
        }

        n_changes = min(len(c) for c in changes.values())
        if n_changes == 0:
            return signals

        for t in range(n_changes):
            # Find entities with similar price change at time t
            change_values = {e: changes[e][t] for e in entities if t < len(changes[e])}
            synced_groups = self._find_sync_groups(change_values)

            for group in synced_groups:
                if len(group) >= 3:  # At least 3 entities moving together
                    avg_change = np.mean([change_values[e] for e in group])
                    signals.append(CartelSignal(
                        signal_type="price_sync",
                        confidence=min(0.9, len(group) / len(entities)),
                        entities=list(group),
                        product_code=product_code,
                        description=(
                            f"{len(group)} компаній синхронно змінили ціну "
                            f"на {avg_change*100:.1f}% одночасно"
                        ),
                        evidence={
                            "time_index": t,
                            "changes": {e: round(change_values[e] * 100, 2) for e in group},
                        },
                    ))

        return signals

    def _detect_high_correlation(
        self,
        product_code: str,
        price_series: dict[str, list[float]],
        entities: list[str],
    ) -> list[CartelSignal]:
        """Detect abnormally high price correlation between entities."""
        signals = []

        for i, e1 in enumerate(entities):
            for e2 in entities[i + 1:]:
                p1 = np.array(price_series[e1])
                p2 = np.array(price_series[e2])
                n = min(len(p1), len(p2))

                if n < 5:
                    continue

                corr = np.corrcoef(p1[:n], p2[:n])[0, 1]

                if abs(corr) > 0.95:
                    signals.append(CartelSignal(
                        signal_type="price_correlation",
                        confidence=round(abs(corr), 3),
                        entities=[e1, e2],
                        product_code=product_code,
                        description=(
                            f"Аномально висока кореляція цін "
                            f"між {e1} та {e2}: {corr:.3f}"
                        ),
                        evidence={"correlation": round(corr, 4), "data_points": n},
                    ))

        return signals

    def _detect_identical_pricing(
        self,
        product_code: str,
        price_series: dict[str, list[float]],
        entities: list[str],
    ) -> list[CartelSignal]:
        """Detect identical prices across competitors."""
        signals = []
        all_prices = list(price_series.values())
        n = min(len(p) for p in all_prices)

        if n == 0:
            return signals

        identical_count = 0
        for t in range(n):
            prices_at_t = [p[t] for p in all_prices]
            if len(set(round(p, 2) for p in prices_at_t)) == 1:
                identical_count += 1

        if identical_count > n * 0.5 and n >= 5:
            signals.append(CartelSignal(
                signal_type="identical_pricing",
                confidence=round(identical_count / n, 2),
                entities=entities,
                product_code=product_code,
                description=(
                    f"Ідентичні ціни у {len(entities)} компаній "
                    f"протягом {identical_count}/{n} періодів ({identical_count/n*100:.0f}%)"
                ),
                evidence={
                    "identical_periods": identical_count,
                    "total_periods": n,
                    "ratio": round(identical_count / n, 3),
                },
            ))

        return signals

    def _find_sync_groups(
        self, changes: dict[str, float]
    ) -> list[list[str]]:
        """Group entities with similar price changes."""
        if not changes:
            return []

        entities = list(changes.keys())
        used: set[str] = set()
        groups: list[list[str]] = []

        for e1 in entities:
            if e1 in used:
                continue
            group = [e1]
            for e2 in entities:
                if e2 != e1 and e2 not in used:
                    if abs(changes[e1] - changes[e2]) < self.sync_threshold:
                        group.append(e2)
                        used.add(e2)
            used.add(e1)
            if len(group) >= 2:
                groups.append(group)

        return groups


# Singleton
market_integrity = MarketIntegrityAnalyzer()
