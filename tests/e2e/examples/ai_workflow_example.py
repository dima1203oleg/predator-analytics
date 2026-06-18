#!/usr/bin/env python3
"""
🤖 AI Workflow Tester - Приклад використання
PREDATOR Analytics v61.0-ELITE
"""

import asyncio
import sys
import os

# Додавання шляху до проекту
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_workflow_tester import AIWorkflowTester


async def main():
    """Приклад використання AI Workflow Tester"""
    
    # Ініціалізація тестера
    tester = AIWorkflowTester(ui_url="http://localhost:3030")
    
    # Запуск повного workflow тестування
    result = await tester.run_full_workflow()
    
    # Вивід результатів
    print(f"\n🤖 AI Workflow Test Results:")
    print(f"  Total queries: {len(result.queries)}")
    print(f"  Success rate: {result.success_rate:.1%}")
    print(f"  Average response time: {result.average_response_time:.2f}s")
    print(f"  Vectors created: {result.vectorization.total_vectors}")
    print(f"  Errors: {len(result.errors)}")
    
    # Детальний аналіз кожного запиту
    print(f"\n📊 Query Details:")
    for query in result.queries:
        status = "✅" if query.success else "❌"
        print(f"  {status} {query.query}")
        print(f"     Type: {query.query_type.value}")
        print(f"     Response time: {query.response_time:.2f}s")
        print(f"     Sources: {', '.join(query.sources_used)}")
        print(f"     Mechanism: {query.search_mechanism}")
        print()


if __name__ == "__main__":
    asyncio.run(main())
