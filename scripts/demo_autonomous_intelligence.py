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
    from app.services.autonomous_intelligence_v2 import LearningRecord, PredictiveMetrics, autonomous_intelligence_v2
except ImportError as e:
    print(f"❌ Помилка імпорту: {e}")
    print(f"Шлях: {sys.path}")
    sys.exit(1)


async def demo_predictive_analyzer():
    """Демонстрація передбачення проблем."""
    print("\n" + "="*60)
    print("🔮 ДЕМОНСТРАЦІЯ: Predictive Analyzer")
    print("="*60)

    analyzer = autonomous_intelligence_v2.predictive_analyzer

    # Симулюємо зростаючі метрики CPU
    print("\n📊 Симуляція зростання CPU usage...")
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
            print(f"  ⏱️  Step {i}: CPU = {cpu:.1f}%")

    # Перевірка передбачень
    predictions = analyzer.predict_issues()

    if predictions:
        print(f"\n⚠️  Виявлено {len(predictions)} потенційних проблем:")
        for pred in predictions:
            print(f"\n  🎯 Тип: {pred['type']}")
            print(f"     Серйозність: {pred['severity']}")
            print(f"     Поточне значення: {pred.get('current_value', 'N/A')}")
            print(f"     Поріг: {pred.get('threshold', 'N/A')}")
            if 'eta_minutes' in pred:
                print(f"     ⏰ ETA до критичного стану: {pred['eta_minutes']} хвилин")
    else:
        print("\n✅ Проблем не виявлено")


async def demo_decision_maker():
    """Демонстрація прийняття автономних рішень."""
    print("\n" + "="*60)
    print("🤖 ДЕМОНСТРАЦІЯ: Autonomous Decision Maker")
    print("="*60)

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

    print("\n📋 Передбачення:")
    print(f"  Тип: {test_prediction['type']}")
    print(f"  Серйозність: {test_prediction['severity']}")
    print(f"  CPU: {test_prediction['current_value']}% (поріг: {test_prediction['threshold']}%)")
    print(f"  ETA: {test_prediction['eta_minutes']} хвилин")

    print("\n🤔 Прийняття рішення...")
    decision = await decision_maker.make_decision([test_prediction], current_state)

    if decision:
        print("\n✅ Рішення прийнято:")
        print(f"  ID: {decision.decision_id}")
        print(f"  Тип: {decision.decision_type}")
        print(f"  Впевненість: {decision.confidence:.2%}")
        print(f"  Виконано: {'✅ Так' if decision.executed else '❌ Ні (низька впевненість)'}")
        print("\n  💭 Пояснення:")
        print(f"     {decision.reasoning}")
        print("\n  🎯 Дії:")
        for i, action in enumerate(decision.actions, 1):
            print(f"     {i}. {action['type']}: {action['params']}")
        print("\n  📊 Очікуваний вплив:")
        for key, value in decision.expected_impact.items():
            print(f"     {key}: {value}")


async def demo_learning_engine():
    """Демонстрація самонавчання."""
    print("\n" + "="*60)
    print("🎓 ДЕМОНСТРАЦІЯ: Self-Learning Engine")
    print("="*60)

    learning_engine = autonomous_intelligence_v2.learning_engine

    # Симулюємо кілька рішень та їх результати
    strategies = ["scale_up", "optimize", "restart"]

    print("\n📚 Симуляція навчання на 30 рішеннях...")
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
            print(f"  ⏱️  Оброблено {i + 1} рішень...")

    # Показати статистику
    stats = learning_engine.get_learning_stats()

    print("\n📊 Статистика навчання:")
    print(f"  Всього записів: {stats['total_records']}")
    print(f"  Вивчено стратегій: {stats['strategies_learned']}")
    print(f"  Середня точність: {stats['average_accuracy']:.2%}")
    print(f"  Найкраща стратегія: {stats['best_strategy']}")

    print("\n🎯 Впевненість у стратегіях:")
    for strategy in strategies:
        confidence = learning_engine.get_strategy_confidence(strategy)
        print(f"  {strategy}: {confidence:.2%}")

    # Рекомендація стратегії
    recommended, confidence = learning_engine.recommend_strategy({})
    print(f"\n💡 Рекомендована стратегія: {recommended} (впевненість: {confidence:.2%})")


async def demo_resource_allocator():
    """Демонстрація динамічного масштабування."""
    print("\n" + "="*60)
    print("📊 ДЕМОНСТРАЦІЯ: Dynamic Resource Allocator")
    print("="*60)

    allocator = autonomous_intelligence_v2.resource_allocator

    print("\n📋 Початковий стан:")
    status = allocator.get_allocation_status()
    print(f"  Workers: {status['current']['workers']}")
    print(f"  Memory: {status['current']['memory_mb']} MB")
    print(f"  CPU Cores: {status['current']['cpu_cores']}")

    # Симулюємо високе навантаження
    print("\n⚡ Симуляція високого навантаження...")
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
        print("\n✅ Ресурси автоматично збільшено:")
        for key, value in changes.items():
            print(f"  {key}: {value}")
    else:
        print("\n✅ Ресурси в нормі, зміни не потрібні")

    # Показати новий стан
    print("\n📋 Новий стан:")
    status = allocator.get_allocation_status()
    print(f"  Workers: {status['current']['workers']}")
    print(f"  Memory: {status['current']['memory_mb']} MB")
    print(f"  CPU Cores: {status['current']['cpu_cores']}")

    print("\n📊 Використання:")
    print(f"  Workers: {status['utilization']['workers']:.1%}")
    print(f"  Memory: {status['utilization']['memory']:.1%}")
    print(f"  CPU: {status['utilization']['cpu']:.1%}")


async def demo_full_cycle():
    """Демонстрація повного циклу роботи."""
    print("\n" + "="*60)
    print("🔄 ДЕМОНСТРАЦІЯ: Повний Цикл Автономної Роботи")
    print("="*60)

    print("\n🚀 Запуск Autonomous Intelligence v2.0...")
    await autonomous_intelligence_v2.start()

    print("✅ Система запущена")

    # Почекати кілька циклів
    print("\n⏳ Очікування 3 циклів роботи (90 секунд)...")
    for i in range(3):
        await asyncio.sleep(30)
        print(f"  ⏱️  Цикл {i + 1}/3 завершено")

    # Показати статус
    print("\n📊 Фінальний статус системи:")
    status = autonomous_intelligence_v2.get_status()

    print(f"\n  Система працює: {'✅ Так' if status['is_running'] else '❌ Ні'}")
    print(f"  Інтервал перевірки: {status['check_interval_seconds']}с")

    pred_stats = status['predictive_analyzer']
    print("\n  🔮 Predictive Analyzer:")
    print(f"     Зібрано метрик: {pred_stats['metrics_collected']}")
    print(f"     Поріг аномалій: {pred_stats['anomaly_threshold']}σ")

    learn_stats = status['learning_engine']
    print("\n  🎓 Learning Engine:")
    print(f"     Всього записів: {learn_stats['total_records']}")
    print(f"     Вивчено стратегій: {learn_stats['strategies_learned']}")
    if learn_stats['best_strategy']:
        print(f"     Найкраща стратегія: {learn_stats['best_strategy']}")

    decision_stats = status['decision_maker']
    print("\n  🤖 Decision Maker:")
    print(f"     Всього рішень: {decision_stats['total_decisions']}")
    print(f"     Мін. впевненість: {decision_stats['min_confidence']:.0%}")

    if decision_stats['recent_decisions']:
        print("\n  📋 Останні рішення:")
        for dec in decision_stats['recent_decisions'][-3:]:
            status_icon = "✅" if dec['success'] else "⏳" if dec['executed'] else "❌"
            print(f"     {status_icon} {dec['type']} (confidence: {dec['confidence']:.0%})")

    print("\n🛑 Зупинка системи...")
    await autonomous_intelligence_v2.stop()
    print("✅ Система зупинена")


async def main():
    """Головна функція."""
    print("\n" + "="*60)
    print("🧠 AUTONOMOUS INTELLIGENCE v2.0 - ДЕМОНСТРАЦІЯ")
    print("="*60)
    print("\nЦя демонстрація показує роботу всіх підсистем:")
    print("  1. 🔮 Predictive Analyzer - передбачення проблем")
    print("  2. 🤖 Autonomous Decision Maker - прийняття рішень")
    print("  3. 🎓 Self-Learning Engine - самонавчання")
    print("  4. 📊 Dynamic Resource Allocator - масштабування")
    print("  5. 🔄 Повний цикл роботи")

    try:
        # Демонстрації
        await demo_predictive_analyzer()
        await demo_decision_maker()
        await demo_learning_engine()
        await demo_resource_allocator()
        await demo_full_cycle()

        print("\n" + "="*60)
        print("✅ ДЕМОНСТРАЦІЯ ЗАВЕРШЕНА УСПІШНО!")
        print("="*60)
        print("\n🎉 Autonomous Intelligence v2.0 готова до роботи!")
        print("\n📚 Детальна документація: AUTONOMY_ANALYSIS_v45.md")
        print("🔧 Workflow: /ultra_autonomous")
        print("🌐 API: /api/v1/v45/autonomous/*")

    except Exception as e:
        print(f"\n❌ Помилка: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
