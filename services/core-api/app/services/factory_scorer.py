"""PREDATOR Factory Core — Scorer логіка
Розраховує Score для паттернів
"""

from app.models.factory import Metrics


def calculate_score(metrics: Metrics) -> float:
    """Комплексна оцінка якості на основі метрик.
    
    Вагові коефіцієнти:
    - coverage: 20% (охоплення тестами)
    - pass_rate: 30% (успішність)
    - performance: 20% (продуктивність)
    - chaos_resilience: 15% (стійкість)
    - business_kpi: 15% (бізнес-результат)
    
    Returns:
        float: Оцінка від 0 до 100

    """
    score = (
        metrics.coverage * 0.20 +
        metrics.pass_rate * 0.30 +
        metrics.performance * 0.20 +
        metrics.chaos_resilience * 0.15 +
        metrics.business_kpi * 0.15
    )
    return round(score, 2)


def should_create_pattern(score: float) -> bool:
    """Чи створити патерн? (score >= 85)"""
    return score >= 85.0


def is_gold_pattern(score: float) -> bool:
    """Чи це Gold Pattern? (score >= 92)"""
    return score >= 92.0


def classify_pattern_type(metrics: Metrics) -> str:
    """Визначити тип патерну на основі метрик"""
    if metrics.performance > 85:
        return "performance"
    elif metrics.chaos_resilience > 85:
        return "stability"
    elif metrics.pass_rate > 95 or metrics.business_kpi > 90:
        return "integration"
    return "other"
