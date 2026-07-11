from __future__ import annotations

#!/usr/bin/env python3
"""Демонстрація Autonomous Intelligence v2.0
Показує роботу всіх підсистем.
"""
import asyncio
from datetime import datetime
from pathlib import Path
import random
import sys

# Додати шлях до проекту
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "services" / "api-gateway"))

# Імпорт модулів
try:
    from app.services.autonomous_intelligence_v2 import (
        LearningRecord,
        PredictiveMetrics,
        autonomous_intelligence_v2,
    )
except ImportError:
    sys.exit(1)


async def demo_predictive_analyzer():
    """Демонстрація передбачення проблем."""
    analyzer = autonomous_intelligence_v2.predictive_analyzer

    # Симулюємо зростаючі метрики CPU
    for i in range(20):
        cpu = 50 + (i * 2)  # Зростає від 50% до 88%
        metrics = PredictiveMetrics(
            timestamp=datetime.utcnow(),
            cpu_usage=cpu,
            memory_usage=random.uniform(60, 70),
            error_rate=random.uniform(0, 2),
            response_time=random.uniform(200, 400),
            throughput=random.uniform(80, 120)
        )
        analyzer.add_metrics(metrics)

        if i % 5 == 0:
            pass

    # Перевірка передбачень
    predictions = analyzer.predict_issues()

    if predictions:
        for pred in predictions:
            if 'eta_minutes' in pred:
                pass
    else:
        pass


async def demo_decision_maker():
    """Демонстрація прийняття автономних рішень."""
    decision_maker = autonomous_intelligence_v2.decision_maker

    # Створюємо тестове передбачення
    test_prediction = {
        "type": "cpu_overload",
        "severity": "high",
        "current_value": 85.5,
        "threshold": 90,
        "eta_minutes": 12,
        "trend": 0.68
    }

    current_state = {
        "active_sources": 5,
        "running_jobs": 3,
        "resource_allocation": {
            "workers": 4,
            "memory_mb": 2048,
            "cpu_cores": 2
        }
    }


    decision = await decision_maker.make_decision([test_prediction], current_state)

    if decision:
        for _i, _action in enumerate(decision.actions, 1):
            pass
        for _key, _value in decision.expected_impact.items():
            pass


async def demo_learning_engine():
    """Демонстрація самонавчання."""
    learning_engine = autonomous_intelligence_v2.learning_engine

    # Симулюємо кілька рішень та їх результати
    strategies = ["scale_up", "optimize", "restart"]

    for i in range(30):
        strategy = random.choice(strategies)
        expected = random.uniform(20, 40)
        # Деякі стратегії працюють краще
        if strategy == "scale_up":
            actual = expected * random.uniform(0.85, 1.15)  # ±15%
        elif strategy == "optimize":
            actual = expected * random.uniform(0.75, 1.25)  # ±25%
        else:  # restart
            actual = expected * random.uniform(0.65, 1.35)  # ±35%

        success = abs(actual - expected) / expected < 0.3

        record = LearningRecord(
            decision_id=f"dec-{i:03d}",
            context={"strategy": strategy},
            action_taken=strategy,
            expected_outcome=expected,
            actual_outcome=actual,
            success=success
        )

        learning_engine.record_outcome(record)

        if (i + 1) % 10 == 0:
            pass

    # Показати статистику
    learning_engine.get_learning_stats()


    for strategy in strategies:
        learning_engine.get_strategy_confidence(strategy)

    # Рекомендація стратегії
    _recommended, _confidence = learning_engine.recommend_strategy({})


async def demo_resource_allocator():
    """Демонстрація динамічного масштабування."""
    allocator = autonomous_intelligence_v2.resource_allocator

    allocator.get_allocation_status()

    # Симулюємо високе навантаження
    high_load_metrics = PredictiveMetrics(
        timestamp=datetime.utcnow(),
        cpu_usage=85.0,
        memory_usage=88.0,
        error_rate=1.5,
        response_time=1500,
        throughput=150
    )

    changes = await allocator.adjust_resources(high_load_metrics)

    if changes:
        for _key, _value in changes.items():
            pass
    else:
        pass

    # Показати новий стан
    allocator.get_allocation_status()



async def demo_full_cycle():
    """Демонстрація повного циклу роботи."""
    await autonomous_intelligence_v2.start()


    # Почекати кілька циклів
    for _i in range(3):
        await asyncio.sleep(30)

    # Показати статус
    status = autonomous_intelligence_v2.get_status()


    status['predictive_analyzer']

    learn_stats = status['learning_engine']
    if learn_stats['best_strategy']:
        pass

    decision_stats = status['decision_maker']

    if decision_stats['recent_decisions']:
        for dec in decision_stats['recent_decisions'][-3:]:
            "✅" if dec['success'] else "⏳" if dec['executed'] else "❌"

    await autonomous_intelligence_v2.stop()


async def main():
    """Головна функція."""
    try:
        # Демонстрації
        await demo_predictive_analyzer()
        await demo_decision_maker()
        await demo_learning_engine()
        await demo_resource_allocator()
        await demo_full_cycle()


    except Exception:
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
