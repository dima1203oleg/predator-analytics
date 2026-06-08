"""Тест для Orchestrator — Перевірка базового циклу.
"""

import asyncio

from core.orchestrator import run_orchestrator


async def test_main():
    task = "Знайди всіх власників компанії ТОВ 'МИТНИЦЯ-СЕРВІС' (ueid: 12345678) та перевір їх у реєстрах ризиків."
    print(f"🚀 Початок тестування завдання: {task}")

    try:
        result = await run_orchestrator(task)
        print("\n✅ ФІНАЛЬНА ВІДПОВІДЬ:")
        print(result["messages"][-1].content)
    except Exception as e:
        print(f"\n❌ ПОМИЛКА: {e!s}")

if __name__ == "__main__":
    asyncio.run(test_main())
