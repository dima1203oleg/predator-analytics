"""CERS v55.2-SM-EXTENDED — Composite Economic Risk Score.
5‑шарова модель аналізу економічної безпеки.
"""

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class LegacyCersLevel(StrEnum):
    """Legacy рівні ризику, використовуються в тестах."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# Alias expected by tests
CersLevel = LegacyCersLevel

@dataclass(frozen=True)
class CersFactors:
    """Параметри для legacy CERS розрахунку."""

    # Санкції
    is_rnbo_sanctioned: bool = False
    is_eu_sanctioned: bool = False
    is_ofac_sanctioned: bool = False
    is_un_sanctioned: bool = False
    # Судові справи
    active_court_cases: int = 0
    # Офшор / PEP
    offshore_connections: int = 0
    has_pep_links: bool = False
    # Митні аномалії
    customs_price_anomaly_count: int = 0
    customs_undervaluation_ratio: float = 0.0
    # Податковий борг (UAH)
    tax_debt_uah: int = 0
    # Додаткові raw‑шари (для зворотної сумісності)
    behavioral_raw: float = 0.0
    institutional_raw: float = 0.0
    influence_raw: float = 0.0
    structural_raw: float = 0.0
    predictive_raw: float = 0.0

@dataclass
class CersResult:
    score: float
    level: LegacyCersLevel
    explanation: str
    factors: dict[str, Any]

def cers_level_from_score(score: float) -> LegacyCersLevel:
    """Визначає legacy рівень за балом."""
    if score < 25:
        return LegacyCersLevel.LOW
    if score < 50:
        return LegacyCersLevel.MEDIUM
    if score < 75:
        return LegacyCersLevel.HIGH
    return LegacyCersLevel.CRITICAL

def compute_cers(factors: CersFactors) -> CersResult:
    """Простий heuristic‑розрахунок, сумісний з тестами."""
    score = 0.0
    if factors.is_rnbo_sanctioned:
        score += 40
    if factors.is_eu_sanctioned:
        score += 20
    if factors.is_ofac_sanctioned:
        score += 20
    if factors.is_un_sanctioned:
        score += 20
    score += factors.active_court_cases * 1.0
    score += factors.offshore_connections * 5.0
    if factors.has_pep_links:
        score += 10.0
    score += factors.customs_price_anomaly_count * 2.0
    score += min(factors.tax_debt_uah / 100_000.0, 20.0)
    raw_total = (
        factors.behavioral_raw
        + factors.institutional_raw
        + factors.influence_raw
        + factors.structural_raw
        + factors.predictive_raw
    )
    score += raw_total * 0.1
    score = max(0.0, min(100.0, score))
    level = cers_level_from_score(score)
    explanation = f"Ризик оцінено як {level.value} з балом {score:.1f}."
    factor_dict = {
        "sanctions": (
            int(factors.is_rnbo_sanctioned)
            + int(factors.is_eu_sanctioned)
            + int(factors.is_ofac_sanctioned)
            + int(factors.is_un_sanctioned)
        ),
        "court": factors.active_court_cases,
        "offshore": factors.offshore_connections,
        "pep": int(factors.has_pep_links),
        "customs_anomalies": factors.customs_price_anomaly_count,
        "tax_debt": factors.tax_debt_uah,
    }
    return CersResult(score=score, level=level, explanation=explanation, factors=factor_dict)

# ---------- New v55 implementation ----------

class CersLevelV55(StrEnum):
    """Канонічні рівні ризику v55.2 (нові)."""

    STABLE = "stable"        # 0..20
    WATCHLIST = "watchlist"  # 21..40
    ELEVATED = "elevated"    # 41..60
    HIGH_ALERT = "high"      # 61..80
    CRITICAL = "critical"    # 81..100

@dataclass(frozen=True)
class Cers5LayerFactors:
    """Вхідні дані для 5‑шарового CERS (v55)."""

    behavioral_raw: float = 0.0
    institutional_raw: float = 0.0
    influence_raw: float = 0.0
    structural_raw: float = 0.0
    predictive_raw: float = 0.0

@dataclass(frozen=True)
class CersResultV55:
    """Результат розрахунку v55."""

    score: float
    level: CersLevelV55
    confidence: float
    components: dict[str, float]
    flags: list[dict[str, Any]] = field(default_factory=list)

def compute_cers_v55(factors: Cers5LayerFactors, confidence: float = 0.95) -> CersResultV55:
    """Канонічний розрахунок CERS v55.2.
    Ваги:
    - Behavioral: 25%
    - Institutional: 20%
    - Influence: 20%
    - Structural: 15%
    - Predictive: 20%
    """
    weights = {
        "behavioral": 0.25,
        "institutional": 0.20,
        "influence": 0.20,
        "structural": 0.15,
        "predictive": 0.20,
    }
    components = {
        "behavioral": min(100.0, max(0.0, factors.behavioral_raw)),
        "institutional": min(100.0, max(0.0, factors.institutional_raw)),
        "influence": min(100.0, max(0.0, factors.influence_raw)),
        "structural": min(100.0, max(0.0, factors.structural_raw)),
        "predictive": min(100.0, max(0.0, factors.predictive_raw)),
    }
    total_score = sum(components[layer] * weights[layer] for layer in weights)
    if total_score < 20:
        level = CersLevelV55.STABLE
    elif total_score < 40:
        level = CersLevelV55.WATCHLIST
    elif total_score < 60:
        level = CersLevelV55.ELEVATED
    elif total_score < 80:
        level = CersLevelV55.HIGH_ALERT
    else:
        level = CersLevelV55.CRITICAL
    return CersResultV55(
        score=total_score,
        level=level,
        confidence=confidence,
        components=components,
    )

def get_level_label_v55(level: CersLevelV55) -> str:
    """Локалізація рівнів (v55)."""
    labels = {
        CersLevelV55.STABLE: "Стабільний",
        CersLevelV55.WATCHLIST: "Під наглядом",
        CersLevelV55.ELEVATED: "Підвищений ризик",
        CersLevelV55.HIGH_ALERT: "Високий ризик",
        CersLevelV55.CRITICAL: "Критичний ризик",
    }
    return labels.get(level, "Невстановлено")
