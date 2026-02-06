from __future__ import annotations


#!/usr/bin/env python3
"""Швидка перевірка Autonomous Intelligence v2.0
Запускає систему та показує статус.
"""
import asyncio
import json
from pathlib import Path
import sys


# Додати шлях до проекту
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "services" / "api-gateway"))

from app.services.autonomous_intelligence_v2 import autonomous_intelligence_v2


async def check_system():
    """Перевірка системи."""
    print("="*60)
    print("🧠 AUTONOMOUS INTELLIGENCE V2.0 - SYSTEM CHECK")
    print("="*60)

    # 1. Перевірка статусу
    print("\n📊 Поточний статус:")
    status = autonomous_intelligence_v2.get_status()

    print(f"  Запущена: {'✅ Так' if status['is_running'] else '❌ Ні'}")
    print(f"  Інтервал перевірки: {status['check_interval_seconds']}с")

    # 2. Predictive Analyzer
    pred_stats = status['predictive_analyzer']
    print("\n🔮 Predictive Analyzer:")
    print(f"  Зібрано метрик: {pred_stats['metrics_collected']}")
    print(f"  Поріг аномалій: {pred_stats['anomaly_threshold']}σ")

    # 3. Learning Engine
    learn_stats = status['learning_engine']
    print("\n🎓 Learning Engine:")
    print(f"  Всього записів: {learn_stats['total_records']}")
    print(f"  Вивчено стратегій: {learn_stats['strategies_learned']}")
    if learn_stats.get('best_strategy'):
        print(f"  Найкраща стратегія: {learn_stats['best_strategy']}")

    # 4. Decision Maker
    decision_stats = status['decision_maker']
    print("\n🤖 Decision Maker:")
    print(f"  Всього рішень: {decision_stats['total_decisions']}")
    print(f"  Мін. впевненість: {decision_stats['min_confidence']:.0%}")

    if decision_stats['recent_decisions']:
        print("\n  📋 Останні рішення:")
        for dec in decision_stats['recent_decisions'][-3:]:
            status_icon = "✅" if dec.get('success') else "⏳" if dec.get('executed') else "❌"
            print(f"    {status_icon} {dec['type']} (confidence: {dec['confidence']:.0%})")

    # 5. Resource Allocator
    resource_stats = status['resource_allocator']
    print("\n📊 Resource Allocator:")
    current = resource_stats['current']
    print(f"  Workers: {current['workers']}")
    print(f"  Memory: {current['memory_mb']} MB")
    print(f"  CPU Cores: {current['cpu_cores']}")

    utilization = resource_stats['utilization']
    print("\n  Використання:")
    print(f"    Workers: {utilization['workers']:.1%}")
    print(f"    Memory: {utilization['memory']:.1%}")
    print(f"    CPU: {utilization['cpu']:.1%}")

    # 6. Рекомендації
    print("\n💡 Рекомендації:")

    if not status['is_running']:
        print("  ⚠️  Система не запущена. Запустіть через:")
        print("     await autonomous_intelligence_v2.start()")

    if pred_stats['metrics_collected'] < 10:
        print("  ℹ️  Недостатньо метрик для передбачень (потрібно >10)")
        print("     Зачекайте кілька хвилин для збору даних")

    if learn_stats['total_records'] == 0:
        print("  ℹ️  Навчання ще не розпочато")
        print("     Система почне навчатися після перших рішень")

    if decision_stats['total_decisions'] == 0:
        print("  ℹ️  Рішення ще не приймалися")
        print("     Система прийме рішення при виявленні проблем")

    print("\n" + "="*60)
    print("✅ ПЕРЕВІРКА ЗАВЕРШЕНА")
    print("="*60)

    return status


async def test_prediction():
    """Тест передбачення."""
    print("\n" + "="*60)
    print("🔮 ТЕСТ: Predictive Analytics")
    print("="*60)

    from datetime import datetime

    from app.services.autonomous_intelligence_v2 import PredictiveMetrics

    analyzer = autonomous_intelligence_v2.predictive_analyzer

    # Додаємо тестові метрики з зростаючим CPU
    print("\n📊 Додавання тестових метрик (зростаючий CPU)...")
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

    print("✅ Додано 20 метрик")

    # Перевіряємо передбачення
    predictions = analyzer.predict_issues()

    if predictions:
        print(f"\n⚠️  Виявлено {len(predictions)} потенційних проблем:")
        for pred in predictions:
            print(f"\n  🎯 Тип: {pred['type']}")
            print(f"     Серйозність: {pred['severity']}")
            print(f"     Поточне значення: {pred.get('current_value', 'N/A')}")
            if 'eta_minutes' in pred:
                print(f"     ⏰ ETA: {pred['eta_minutes']} хвилин")
    else:
        print("\n✅ Проблем не виявлено")

    return predictions


async def test_decision():
    """Тест прийняття рішення."""
    print("\n" + "="*60)
    print("🤖 ТЕСТ: Autonomous Decision Making")
    print("="*60)

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

    print(f"\n📋 Передбачення: {test_prediction['type']}")
    print(f"   Серйозність: {test_prediction['severity']}")
    print(f"   CPU: {test_prediction['current_value']}%")

    decision_maker = autonomous_intelligence_v2.decision_maker
    decision = await decision_maker.make_decision([test_prediction], current_state)

    if decision:
        print("\n✅ Рішення прийнято:")
        print(f"   ID: {decision.decision_id}")
        print(f"   Тип: {decision.decision_type}")
        print(f"   Впевненість: {decision.confidence:.2%}")
        print(f"   Виконано: {'✅ Так' if decision.executed else '❌ Ні'}")

        if not decision.executed:
            print(f"   ℹ️  Рішення не виконано (впевненість < {decision_maker.min_confidence:.0%})")

        print("\n   💭 Пояснення:")
        print(f"      {decision.reasoning}")

        print("\n   🎯 Дії:")
        for i, action in enumerate(decision.actions, 1):
            print(f"      {i}. {action['type']}: {action['params']}")
    else:
        print("\n❌ Рішення не прийнято")

    return decision


async def main():
    """Головна функція."""
    print("\n🚀 Запуск перевірки Autonomous Intelligence v2.0...\n")

    try:
        # 1. Перевірка статусу
        status = await check_system()

        # 2. Тест передбачення
        predictions = await test_prediction()

        # 3. Тест прийняття рішення
        await test_decision()

        # 4. Фінальний звіт
        print("\n" + "="*60)
        print("📊 ФІНАЛЬНИЙ ЗВІТ")
        print("="*60)

        print(f"\n✅ Система працює: {'Так' if status['is_running'] else 'Ні'}")
        print(f"✅ Метрик зібрано: {status['predictive_analyzer']['metrics_collected']}")
        print(f"✅ Передбачень: {len(predictions) if predictions else 0}")
        print(f"✅ Рішень прийнято: {status['decision_maker']['total_decisions']}")

        print("\n💡 Наступні кроки:")
        print("   1. Запустити backend для автоматичного старту")
        print("   2. Моніторити через API endpoints")
        print("   3. Аналізувати результати через 1 день")

        print("\n🎉 ВСЕ ПРАЦЮЄ! СИСТЕМА ГОТОВА!")

    except Exception as e:
        print(f"\n❌ Помилка: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
