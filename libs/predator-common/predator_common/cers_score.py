"""
CERS v55.2-SM-EXTENDED — Composite Economic Risk Score.
5-шарова модель аналізу економічної безпеки.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any

class CersLevel(str, Enum):
    """Канонічні рівні ризику v55.2."""
    STABLE = "stable"        # 0..20
    WATCHLIST = "watchlist"  # 21..40
    ELEVATED = "elevated"    # 41..60
    HIGH_ALERT = "high"      # 61..80
    CRITICAL = "critical"    # 81..100

@dataclass(frozen=True)
class Cers5LayerFactors:
    """Вхідні дані для 5-шарового CERS."""
    # L1: Behavioral (Activity, Anomalies)
    behavioral_raw: float = 0.0
    # L2: Institutional (Sanctions, Court, Tax)
    institutional_raw: float = 0.0
    # L3: Influence (Graph, Network, UBO Connections)
    influence_raw: float = 0.0
    # L4: Structural (Complexity, Offshore, Longevity)
    structural_raw: float = 0.0
    # L5: Predictive (ML Forecast, Market Trends)
    predictive_raw: float = 0.0

@dataclass(frozen=True)
class CersResultV55:
    """Розширений результат CERS v55.2."""
    score: float
    level: CersLevel
    confidence: float
    components: Dict[str, float]
    flags: List[Dict[str, Any]] = field(default_factory=list)

def compute_cers_v55(factors: Cers5LayerFactors, confidence: float = 0.95) -> CersResultV55:
    """
    Канонічний розрахунок CERS v55.2.
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
        "predictive": 0.20
    }
    
    components = {
        "behavioral": min(100.0, max(0.0, factors.behavioral_raw)),
        "institutional": min(100.0, max(0.0, factors.institutional_raw)),
        "influence": min(100.0, max(0.0, factors.influence_raw)),
        "structural": min(100.0, max(0.0, factors.structural_raw)),
        "predictive": min(100.0, max(0.0, factors.predictive_raw))
    }
    
    total_score = sum(components[layer] * weights[layer] for layer in weights)
    
    # Визначення рівня
    if total_score < 20: level = CersLevel.STABLE
    elif total_score < 40: level = CersLevel.WATCHLIST
    elif total_score < 60: level = CersLevel.ELEVATED
    elif total_score < 80: level = CersLevel.HIGH_ALERT
    else: level = CersLevel.CRITICAL
    
    return CersResultV55(
        score=total_score,
        level=level,
        confidence=confidence,
        components=components
    )

def get_level_label(level: CersLevel) -> str:
    """Локалізація рівнів."""
    labels = {
        CersLevel.STABLE: "Стабільний",
        CersLevel.WATCHLIST: "Під наглядом",
        CersLevel.ELEVATED: "Підвищений ризик",
        CersLevel.HIGH_ALERT: "Високий ризик",
        CersLevel.CRITICAL: "Критичний ризик"
    }
    return labels.get(level, "Невстановлено")
