from __future__ import annotations

#!/usr/bin/env python3
"""Швидка перевірка Autonomous Intelligence v2.0
Запускає систему та показує статус.
"""
import asyncio
from pathlib import Path
import sys

# Додати шлях до проекту
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "services" / "api-gateway"))

from app.services.autonomous_intelligence_v2 import autonomous_intelligence_v2


async def check_system():
    """Перевірка системи."""
    # 1. Перевірка статусу
    status = autonomous_intelligence_v2.get_status()


    # 2. Predictive Analyzer
    pred_stats = status['predictive_analyzer']

    # 3. Learning Engine
    learn_stats = status['learning_engine']
    if learn_stats.get('best_strategy'):
        pass

    # 4. Decision Maker
    decision_stats = status['decision_maker']

    if decision_stats['recent_decisions']:
        for dec in decision_stats['recent_decisions'][-3:]:
            "✅" if dec.get('success') else "⏳" if dec.get('executed') else "❌"

    # 5. Resource Allocator
    resource_stats = status['resource_allocator']
    resource_stats['current']

    resource_stats['utilization']

    # 6. Рекомендації

    if not status['is_running']:
        pass

    if pred_stats['metrics_collected'] < 10:
        pass

    if learn_stats['total_records'] == 0:
        pass

    if decision_stats['total_decisions'] == 0:
        pass


    return status


async def test_prediction():
    """Тест передбачення."""
    from datetime import datetime

    from app.services.autonomous_intelligence_v2 import PredictiveMetrics

    analyzer = autonomous_intelligence_v2.predictive_analyzer

    # Додаємо тестові метрики з зростаючим CPU
    for i in range(20):
        metrics = PredictiveMetrics(
            timestamp=datetime.utcnow(),
            cpu_usage=50 + (i * 2),  # 50% -> 88%
            memory_usage=60.0,
            error_rate=1.0,
            response_time=300.0,
            throughput=100.0
        )
        analyzer.add_metrics(metrics)


    # Перевіряємо передбачення
    predictions = analyzer.predict_issues()

    if predictions:
        for pred in predictions:
            if 'eta_minutes' in pred:
                pass
    else:
        pass

    return predictions


async def test_decision():
    """Тест прийняття рішення."""
    # Створюємо тестове передбачення
    test_prediction = {
        "type": "cpu_overload",
        "severity": "high",
        "current_value": 85.0,
        "threshold": 90,
        "eta_minutes": 12
    }

    current_state = {
        "active_sources": 5,
        "running_jobs": 3
    }


    decision_maker = autonomous_intelligence_v2.decision_maker
    decision = await decision_maker.make_decision([test_prediction], current_state)

    if decision:

        if not decision.executed:
            pass


        for _i, _action in enumerate(decision.actions, 1):
            pass
    else:
        pass

    return decision


async def main():
    """Головна функція."""
    try:
        # 1. Перевірка статусу
        await check_system()

        # 2. Тест передбачення
        await test_prediction()

        # 3. Тест прийняття рішення
        await test_decision()

        # 4. Фінальний звіт




    except Exception:
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
