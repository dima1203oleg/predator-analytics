from __future__ import annotations


#!/usr/bin/env python3
"""🎯 DEMO: Triple CLI Chain для швидкого тестування
Простий приклад використання Gemini → Mistral → Aider.
"""

from pathlib import Path
import sys


# Додаємо scripts до path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from triple_cli import TripleCLIChain

    print("=" * 70)
    print("🎯 DEMO: Triple CLI Chain")
    print("=" * 70)
    print()

    # Створюємо ланцюжок
    chain = TripleCLIChain()

    # Простий приклад: генерація Hello World скрипту
    task = "Створи простий Python скрипт що виводить 'Hello from Predator Analytics v45.0!'"

    print(f"📝 Завдання: {task}")
    print()

    # Запускаємо ланцюжок
    code = chain.run_chain(task, "./demo_hello.py")

    print()
    print("=" * 70)
    print("✅ DEMO завершено!")
    print("=" * 70)
    print()
    print("🚀 Запустіть згенерований скрипт:")
    print("   python3 ./demo_hello.py")
    print()

except ImportError as e:
    print(f"❌ Помилка імпорту: {e}")
    print()
    print("Переконайтеся що встановлені:")
    print("  - google-generativeai")
    print("  - mistralai")
    print()
    print("Встановіть: pip3 install google-generativeai mistralai --break-system-packages")
    sys.exit(1)
except Exception as e:
    print(f"❌ Помилка: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
