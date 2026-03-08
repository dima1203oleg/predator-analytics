"""
CERS Score — Composite Economic Risk Score (Композитний індекс економічного ризику).

Алгоритм обчислення CERS для компаній та осіб.

Рівні ризику:
  < 25  → low (низький)
  25..49 → medium (середній)
  50..74 → high (високий)
  ≥ 75   → critical (критичний)

Вхідні фактори (з вагами):
  - Санкції (РНБО, ЄС, OFAC)  → вага 0.40
  - Судові справи (активні)     → вага 0.20
  - Офшорні зв'язки            → вага 0.15
  - PEP-зв'язки                → вага 0.10
  - Митні аномалії             → вага 0.10
  - Фінансові ризики           → вага 0.05
"""

from dataclasses import dataclass
from enum import Enum


class CersLevel(str, Enum):
    """Рівні CERS ризику."""
    LOW = "low"          # 0..24
    MEDIUM = "medium"    # 25..49
    HIGH = "high"        # 50..74
    CRITICAL = "critical"  # 75..100


@dataclass(frozen=True)
class CersFactors:
    """
    Вхідні фактори для обчислення CERS.

    Всі значення логічні або числові:
    - Логічні множаться на 100 (True = 100)
    - Числові нормуються до 0..100
    """
    # Санкції (найвища вага)
    is_rnbo_sanctioned: bool = False        # РНБО
    is_eu_sanctioned: bool = False          # ЄС
    is_ofac_sanctioned: bool = False        # OFAC (США)
    is_un_sanctioned: bool = False          # ООН

    # Судові ризики
    active_court_cases: int = 0             # Кількість активних судових справ
    lost_court_cases_ratio: float = 0.0     # % програних справ (0.0..1.0)

    # Корпоративні ризики
    offshore_connections: int = 0           # Кількість офшорних зв'язків
    has_pep_links: bool = False             # Зв'язок з PEP

    # Митні ризики
    customs_price_anomaly_count: int = 0    # Кількість цінових аномалій в деклараціях
    customs_undervaluation_ratio: float = 0.0  # % декларацій з заниженою ціною

    # Фінансові ризики
    tax_debt_uah: float = 0.0              # Податковий борг (грн)
    bank_debt_days: int = 0               # Прострочений банківський борг (дні)


@dataclass(frozen=True)
class CersResult:
    """Результат обчислення CERS."""
    score: int                    # 0..100
    level: CersLevel
    factors: dict[str, float]     # Пояснення внеску кожного фактору
    explanation: str              # Текстове пояснення (українською)


def _sanctions_score(f: CersFactors) -> float:
    """Обчислити суб-бал санкцій (0..100)."""
    # Будь-яка офіційна санкція → максимальний бал одразу
    if f.is_rnbo_sanctioned or f.is_eu_sanctioned or f.is_ofac_sanctioned or f.is_un_sanctioned:
        return 100.0
    return 0.0


def _court_score(f: CersFactors) -> float:
    """Обчислити суб-бал судових ризиків (0..100)."""
    # До 10 справ — поступове зростання
    case_score = min(100.0, f.active_court_cases * 10)
    ratio_score = f.lost_court_cases_ratio * 100
    return (case_score + ratio_score) / 2


def _offshore_score(f: CersFactors) -> float:
    """Обчислити суб-бал офшорних ризиків (0..100)."""
    offshore = min(100.0, f.offshore_connections * 25)
    pep = 50.0 if f.has_pep_links else 0.0
    return (offshore + pep) / 2


def _customs_score(f: CersFactors) -> float:
    """Обчислити суб-бал митних ризиків (0..100)."""
    anomaly = min(100.0, f.customs_price_anomaly_count * 20)
    underval = f.customs_undervaluation_ratio * 100
    return max(anomaly, underval)


def _financial_score(f: CersFactors) -> float:
    """Обчислити суб-бал фінансових ризиків (0..100)."""
    tax_score = min(100.0, f.tax_debt_uah / 100_000)  # 100k ₴ → 1 бал
    debt_score = min(100.0, f.bank_debt_days)           # 1 день = 1 бал
    return (tax_score + debt_score) / 2


def compute_cers(factors: CersFactors) -> CersResult:
    """
    Обчислити CERS Score для компанії або особи.

    Args:
        factors: Вхідні фактори ризику

    Returns:
        CersResult з балом 0..100, рівнем та поясненням

    Приклад:
        >>> factors = CersFactors(is_rnbo_sanctioned=True, offshore_connections=2)
        >>> result = compute_cers(factors)
        >>> result.level
        CersLevel.CRITICAL
    """
    # Ваги факторів
    weights: dict[str, tuple[float, float]] = {
        "sanctions":  (0.40, _sanctions_score(factors)),
        "court":      (0.20, _court_score(factors)),
        "offshore":   (0.15, _offshore_score(factors)),
        "customs":    (0.10, _customs_score(factors)),
        "financial":  (0.05, _financial_score(factors)),
    }

    # Зважена сума
    total_score = sum(weight * sub_score for weight, sub_score in weights.values())
    raw_score = min(100.0, max(0.0, total_score))

    # Гарантований мінімум CRITICAL для санкціонованих сутностей (HR санкцій)
    has_any_sanction = (
        factors.is_rnbo_sanctioned
        or factors.is_eu_sanctioned
        or factors.is_ofac_sanctioned
        or factors.is_un_sanctioned
    )
    if has_any_sanction:
        raw_score = max(raw_score, 75.0)

    score = round(raw_score)

    # Рівень ризику
    if score < 25:
        level = CersLevel.LOW
    elif score < 50:
        level = CersLevel.MEDIUM
    elif score < 75:
        level = CersLevel.HIGH
    else:
        level = CersLevel.CRITICAL

    # Фактори внеску
    factor_contributions = {
        name: round(weight * sub_score, 2)
        for name, (weight, sub_score) in weights.items()
    }

    # Пояснення (українською, HR-03)
    explanation_parts: list[str] = []
    if factors.is_rnbo_sanctioned or factors.is_eu_sanctioned or factors.is_ofac_sanctioned:
        explanation_parts.append("Фігурує у санкційних списках")
    if factors.active_court_cases > 0:
        explanation_parts.append(f"{factors.active_court_cases} активних судових справ")
    if factors.offshore_connections > 0:
        explanation_parts.append(f"{factors.offshore_connections} офшорних зв'язків")
    if factors.has_pep_links:
        explanation_parts.append("Зв'язки з PEP")
    if factors.customs_price_anomaly_count > 0:
        explanation_parts.append(f"{factors.customs_price_anomaly_count} цінових аномалій у митних деклараціях")
    if factors.tax_debt_uah > 0:
        explanation_parts.append(f"Податковий борг {factors.tax_debt_uah:,.0f} ₴")

    explanation = "; ".join(explanation_parts) if explanation_parts else "Ризик-фактори відсутні"

    return CersResult(
        score=score,
        level=level,
        factors=factor_contributions,
        explanation=explanation,
    )


def cers_level_from_score(score: int) -> CersLevel:
    """Визначити рівень ризику за балом."""
    if score < 25:
        return CersLevel.LOW
    if score < 50:
        return CersLevel.MEDIUM
    if score < 75:
        return CersLevel.HIGH
    return CersLevel.CRITICAL
