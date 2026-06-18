#!/usr/bin/env python3
"""
🔧 Self-Healing Engine - Приклад використання
PREDATOR Analytics v61.0-ELITE
"""

import asyncio
import sys
import os

# Додавання шляху до проекту
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from self_healing_engine import SelfHealingEngine


async def main():
    """Приклад використання Self-Healing Engine"""
    
    # Ініціалізація двигуна самовідновлення
    engine = SelfHealingEngine(
        nvidia_server="predator-server",
        enable_llm=True  # Увімкнути LLM діагностику
    )
    
    # Підготовка тестових даних
    error_logs = [
        "ERROR: Connection timeout to database",
        "ERROR: Memory allocation failed",
        "ERROR: Database connection pool exhausted"
    ]
    
    system_metrics = {
        "cpu_usage": 85.0,
        "memory_usage": 92.0,
        "disk_usage": 45.0,
        "network_latency": 150.0
    }
    
    # Запуск процесу самовідновлення
    result = await engine.run_self_healing(error_logs, system_metrics)
    
    # Вивід результатів
    print(f"\n🔧 Self-Healing Results:")
    print(f"  Diagnosis: {result.diagnosis.problem_type}")
    print(f"  Root cause: {result.diagnosis.root_cause}")
    print(f"  Confidence: {result.diagnosis.confidence:.1%}")
    print(f"  Actions taken: {len(result.actions_taken)}")
    print(f"  Success: {result.success}")
    print(f"  Requires manual intervention: {result.requires_manual_intervention}")
    print(f"  Total duration: {result.total_duration:.2f}s")
    
    # Детальний аналіз дій
    print(f"\n📊 Actions Taken:")
    for action in result.actions_taken:
        status = "✅" if action.success else "❌"
        print(f"  {status} {action.action.value} on {action.target}")
        print(f"     Duration: {action.duration:.2f}s")
        if action.error:
            print(f"     Error: {action.error}")
    
    # Рекомендації
    print(f"\n💡 Suggested Actions:")
    for suggestion in result.diagnosis.suggested_actions:
        print(f"  - {suggestion}")
    
    # Проблеми, що залишилися
    if result.remaining_issues:
        print(f"\n⚠️ Remaining Issues:")
        for issue in result.remaining_issues:
            print(f"  - {issue}")


if __name__ == "__main__":
    asyncio.run(main())
