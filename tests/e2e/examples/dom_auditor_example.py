#!/usr/bin/env python3
"""
🖥️ DOM & Frontend Auditor - Приклад використання
PREDATOR Analytics v61.0-ELITE
"""

import asyncio
import sys
import os

# Додавання шляху до проекту
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dom_frontend_auditor import DOMFrontendAuditor


async def main():
    """Приклад використання DOM & Frontend Auditor"""
    
    # Ініціалізація аудитора
    auditor = DOMFrontendAuditor(ui_url="http://localhost:3030")
    
    # Запуск повного аудиту
    result = await auditor.run_full_audit()
    
    # Вивід результатів
    print(f"\n🖥️ DOM & Frontend Audit Results:")
    print(f"  Total issues: {len(result.issues)}")
    print(f"  Console errors: {len(result.console_errors)}")
    print(f"  Network errors: {len(result.network_errors)}")
    print(f"  Accessibility issues: {len(result.accessibility_issues)}")
    print(f"  Components audited: {len(result.component_audits)}")
    print(f"  Total duration: {result.total_duration:.2f}s")
    
    # Детальний аналіз проблем
    print(f"\n📊 Issue Details:")
    critical_issues = [i for i in result.issues if i.severity.value == 'critical']
    high_issues = [i for i in result.issues if i.severity.value == 'high']
    
    print(f"  Critical issues: {len(critical_issues)}")
    for issue in critical_issues:
        print(f"    - {issue.message} ({issue.category})")
    
    print(f"  High issues: {len(high_issues)}")
    for issue in high_issues:
        print(f"    - {issue.message} ({issue.category})")
    
    # Метрики продуктивності
    print(f"\n⚡ Performance Metrics:")
    print(f"  First Contentful Paint: {result.performance_metrics.first_contentful_paint:.2f}s")
    print(f"  Largest Contentful Paint: {result.performance_metrics.largest_contentful_paint:.2f}s")
    print(f"  Time to Interactive: {result.performance_metrics.time_to_interactive:.2f}s")
    print(f"  Cumulative Layout Shift: {result.performance_metrics.cumulative_layout_shift:.3f}")


if __name__ == "__main__":
    asyncio.run(main())
