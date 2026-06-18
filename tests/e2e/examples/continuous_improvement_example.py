#!/usr/bin/env python3
"""
📈 Continuous Improvement Module - Приклад використання
PREDATOR Analytics v61.0-ELITE
"""

import asyncio
import sys
import os

# Додавання шляху до проекту
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from continuous_improvement import ContinuousImprovementModule


async def main():
    """Приклад використання Continuous Improvement Module"""
    
    # Ініціалізація модуля
    module = ContinuousImprovementModule(nvidia_server="predator-server")
    
    # Запуск процесу безперервного покращення
    result = await module.run_continuous_improvement()
    
    # Вивід результатів
    print(f"\n📈 Continuous Improvement Results:")
    print(f"  Performance metrics collected: {len(result.performance_metrics)}")
    print(f"  Optimization recommendations: {len(result.optimization_recommendations)}")
    print(f"  Architecture recommendations: {len(result.architecture_recommendations)}")
    print(f"  SQL queries analyzed: {len(result.sql_query_analyses)}")
    print(f"  Total duration: {result.total_duration:.2f}s")
    
    # Детальний аналіз метрик продуктивності
    print(f"\n📊 Performance Metrics:")
    for metric in result.performance_metrics:
        status = "✅" if metric.status == "ok" else "⚠️" if metric.status == "warning" else "❌"
        print(f"  {status} {metric.name}: {metric.value:.1f}{metric.unit} (threshold: {metric.threshold}{metric.unit})")
        print(f"     Trend: {metric.trend}")
    
    # Рекомендації щодо оптимізації
    print(f"\n💡 Optimization Recommendations:")
    critical_recs = [r for r in result.optimization_recommendations if r.priority.value == 'critical']
    high_recs = [r for r in result.optimization_recommendations if r.priority.value == 'high']
    
    print(f"  Critical: {len(critical_recs)}")
    for rec in critical_recs:
        print(f"    - {rec.title}")
        print(f"      {rec.description}")
        print(f"      Expected impact: {rec.expected_impact}")
        print(f"      Effort: {rec.effort}")
    
    print(f"  High: {len(high_recs)}")
    for rec in high_recs:
        print(f"    - {rec.title}")
        print(f"      {rec.description}")
    
    # Архітектурні рекомендації
    print(f"\n🏗️ Architecture Recommendations:")
    for rec in result.architecture_recommendations:
        print(f"  - {rec}")
    
    # Результати регресійних тестів
    print(f"\n🧪 Regression Test Results:")
    regression = result.regression_test_results
    print(f"  Total tests: {regression.get('total_tests', 0)}")
    print(f"  Passed: {regression.get('passed', 0)}")
    print(f"  Failed: {regression.get('failed', 0)}")
    print(f"  Success rate: {regression.get('success_rate', 0):.1%}")
    print(f"  Status: {regression.get('status', 'unknown')}")


if __name__ == "__main__":
    asyncio.run(main())
