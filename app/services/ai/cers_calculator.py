"""CERS 5-Layer Meta-Scoring Calculator (Phase 5B — SM Edition).

Composite Entity Risk Score = f(Behavioral, Institutional, Influence, Structural, Predictive).
Implements §9 of the TZ.

Output: 0..100 scale, with sub-scores and confidence.
"""
from datetime import UTC, datetime
from typing import Any

# CERS Layer Weights (§9.3)
LAYER_WEIGHTS: dict[str, float] = {
    "behavioral": 0.25,
    "institutional": 0.20,
    "influence": 0.20,
    "structural": 0.20,
    "predictive": 0.15,
}

# Layer descriptions (§9.2)
LAYER_INFO: dict[str, dict[str, str]] = {
    "behavioral": {
        "ua_name": "Поведінковий шар",
        "description": "Аналіз транзакцій, митних патернів, часових аномалій",
        "sources": "declarations, transactions, customs_history",
    },
    "institutional": {
        "ua_name": "Інституційний шар",
        "description": "Реєстраційні дані, юридичний статус, ліцензії",
        "sources": "edr, licenses, court_registry",
    },
    "influence": {
        "ua_name": "Шар впливу",
        "description": "Зв'язки, бенефіціари, PEP, санкції",
        "sources": "beneficial_owners, sanctions, pep_lists, graph_analysis",
    },
    "structural": {
        "ua_name": "Структурний шар",
        "description": "Організаційна структура, філії, група компаній",
        "sources": "company_relations, group_structure, geographic_analysis",
    },
    "predictive": {
        "ua_name": "Предиктивний шар",
        "description": "ML-прогнози, тренди, аномалії майбутнього",
        "sources": "ml_models, trend_analysis, anomaly_detection",
    },
}

# CERS Grade thresholds (§9.5)
GRADE_THRESHOLDS: list[dict[str, Any]] = [
    {"min": 80, "max": 100, "grade": "A+", "label": "Мінімальний ризик", "color": "#22c55e"},
    {"min": 65, "max": 79, "grade": "A", "label": "Низький ризик", "color": "#86efac"},
    {"min": 50, "max": 64, "grade": "B", "label": "Помірний ризик", "color": "#fbbf24"},
    {"min": 35, "max": 49, "grade": "C", "label": "Підвищений ризик", "color": "#fb923c"},
    {"min": 20, "max": 34, "grade": "D", "label": "Високий ризик", "color": "#f87171"},
    {"min": 0, "max": 19, "grade": "F", "label": "Критичний ризик", "color": "#ef4444"},
]


class CERSCalculator:
    """CERS 5-Layer Meta-Scoring Calculator (§9)."""

    def __init__(self) -> None:
        self.weights = LAYER_WEIGHTS.copy()

    def calculate(
        self,
        behavioral: float = 50.0,
        institutional: float = 50.0,
        influence: float = 50.0,
        structural: float = 50.0,
        predictive: float = 50.0,
    ) -> dict[str, Any]:
        """Розрахувати CERS з 5-ти шарів.

        Всі параметри: 0.0 — 100.0.
        """
        total = (
            self.weights["behavioral"] * behavioral
            + self.weights["institutional"] * institutional
            + self.weights["influence"] * influence
            + self.weights["structural"] * structural
            + self.weights["predictive"] * predictive
        )
        total = round(total, 2)
        grade = self._get_grade(total)

        return {
            "cers_total": total,
            "grade": grade["grade"],
            "label": grade["label"],
            "color": grade["color"],
            "layers": {
                "behavioral": {"score": behavioral, "weight": self.weights["behavioral"]},
                "institutional": {"score": institutional, "weight": self.weights["institutional"]},
                "influence": {"score": influence, "weight": self.weights["influence"]},
                "structural": {"score": structural, "weight": self.weights["structural"]},
                "predictive": {"score": predictive, "weight": self.weights["predictive"]},
            },
            "calculated_at": datetime.now(UTC).isoformat(),
        }

    def _get_grade(self, score: float) -> dict[str, Any]:
        """Визначити CERS grade за score."""
        for g in GRADE_THRESHOLDS:
            if g["min"] <= score <= g["max"]:
                return g
        return GRADE_THRESHOLDS[-1]

    def get_config(self) -> dict[str, Any]:
        """Конфігурація CERS калькулятора."""
        return {
            "version": "v55.3",
            "layers": len(LAYER_WEIGHTS),
            "weights": self.weights,
            "grades": GRADE_THRESHOLDS,
            "layer_info": LAYER_INFO,
        }
