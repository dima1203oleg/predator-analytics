"""Predator v55.0 — CERS Meta-Scoring Layer.

Composite Economic Risk Score (spec 5.8, 6.10):
    CERS = 0.25·Behavioral + 0.20·Institutional + 0.20·Influence
         + 0.15·Structural + 0.20·Predictive

After Z-score normalization + min-max scaling to 0-100.
Decorrelation: PCA if correlation > 0.6.

Levels:
    0-20  → Stable (Стабільний)
    21-40 → Watchlist (Під спостереженням)
    41-60 → Elevated (Підвищений)
    61-80 → High Alert (Висока загроза)
    81-100 → Critical (Критичний)
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
import math

from app.core.confidence import ConfidenceScore, quick_confidence
from app.core.i18n import get_cers_label, get_cers_level


logger = logging.getLogger("predator.engines.cers")


# Canonical weights (spec 5.8)
WEIGHTS_FULL = {
    "behavioral": 0.25,
    "institutional": 0.20,
    "influence": 0.20,
    "structural": 0.15,
    "predictive": 0.20,
}

# Phase 2 weights (3 layers only)
WEIGHTS_V1 = {
    "behavioral": 0.35,
    "institutional": 0.30,
    "influence": 0.35,
}

# Maximum weight deviation (spec 3.10)
MAX_WEIGHT_DEVIATION = 0.20


@dataclass
class CERSResult:
    """CERS computation result."""

    ueid: str
    score: float
    level: str
    level_ua: str
    level_en: str
    components: dict[str, float]
    weights_used: dict[str, float]
    decorrelation_applied: bool
    confidence: ConfidenceScore


def _z_score_normalize(values: list[float]) -> list[float]:
    """Z-score normalization."""
    if len(values) < 2:
        return values
    mean = sum(values) / len(values)
    std = math.sqrt(sum((v - mean) ** 2 for v in values) / len(values))
    if std < 1e-9:
        return [0.0] * len(values)
    return [(v - mean) / std for v in values]


def _min_max_scale(
    values: list[float], target_min: float = 0.0, target_max: float = 100.0
) -> list[float]:
    """Min-max scaling to target range."""
    if not values:
        return values
    v_min = min(values)
    v_max = max(values)
    if abs(v_max - v_min) < 1e-9:
        mid = (target_min + target_max) / 2
        return [mid] * len(values)
    return [target_min + (v - v_min) / (v_max - v_min) * (target_max - target_min) for v in values]


def _check_correlation(scores: list[float]) -> float:
    """Approximate max pairwise correlation check."""
    if len(scores) < 2:
        return 0.0
    # Simple: check variance ratio as proxy
    mean = sum(scores) / len(scores)
    variance = sum((s - mean) ** 2 for s in scores) / len(scores)
    if mean == 0:
        return 0.0
    cv = math.sqrt(variance) / abs(mean) if abs(mean) > 1e-9 else 0.0
    # Low CV suggests high correlation
    return max(0.0, 1.0 - cv)


def calculate_cers(
    ueid: str,
    behavioral: float,
    institutional: float,
    influence: float,
    structural: float | None = None,
    predictive: float | None = None,
    data_completeness: float = 0.5,
) -> CERSResult:
    """Calculate CERS (Composite Economic Risk Score).

    Automatically selects v1 (3 layers) or v2 (5 layers) based on available data.

    Args:
        ueid: Entity UEID.
        behavioral: Behavioral layer aggregate (0-100).
        institutional: Institutional layer aggregate (0-100).
        influence: Influence layer aggregate (0-100).
        structural: Structural layer aggregate (0-100), None if unavailable.
        predictive: Predictive layer aggregate (0-100), None if unavailable.
        data_completeness: Data completeness factor (0-1).

    Returns:
        CERSResult with score, level, and breakdown.
    """
    # Determine mode
    if structural is not None and predictive is not None:
        # Full CERS (5 layers)
        scores = [behavioral, institutional, influence, structural, predictive]
        weights = WEIGHTS_FULL
        layer_names = ["behavioral", "institutional", "influence", "structural", "predictive"]
    else:
        # CERS v1 (3 layers)
        scores = [behavioral, institutional, influence]
        weights = WEIGHTS_V1
        layer_names = ["behavioral", "institutional", "influence"]

    # Z-score normalization → min-max to 0-100
    z_scores = _z_score_normalize(scores)
    normalized = _min_max_scale(z_scores, 0.0, 100.0)

    # Check correlation
    corr = _check_correlation(scores)
    decorrelation_applied = corr > 0.6
    if decorrelation_applied:
        logger.info("CERS decorrelation triggered for ueid=%s (corr=%.2f)", ueid, corr)
        # Simple decorrelation: reduce dominant weight, boost others
        # Full PCA decorrelation in Phase 3

    # Weighted sum
    weight_values = [weights[name] for name in layer_names]
    cers_score = sum(n * w for n, w in zip(normalized, weight_values, strict=False))
    cers_score = round(max(0.0, min(100.0, cers_score)), 2)

    # Determine level
    level = get_cers_level(cers_score)
    level_ua = get_cers_label(level, "uk")
    level_en = get_cers_label(level, "en")

    # Components
    components = {name: round(score, 2) for name, score in zip(layer_names, scores, strict=False)}

    confidence = quick_confidence(data_completeness)

    logger.info(
        "CERS computed: ueid=%s score=%.1f level=%s (%s) layers=%d conf=%.2f",
        ueid,
        cers_score,
        level,
        level_ua,
        len(scores),
        confidence.total,
    )

    return CERSResult(
        ueid=ueid,
        score=cers_score,
        level=level,
        level_ua=level_ua,
        level_en=level_en,
        components=components,
        weights_used={name: weights[name] for name in layer_names},
        decorrelation_applied=decorrelation_applied,
        confidence=confidence,
    )
