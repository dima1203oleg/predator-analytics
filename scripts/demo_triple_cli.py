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


    # Створюємо ланцюжок
    chain = TripleCLIChain()

    # Простий приклад: генерація Hello World скрипту
    task = "Створи простий Python скрипт що виводить 'Hello from Predator Analytics v45.0!'"


    # Запускаємо ланцюжок
    code = chain.run_chain(task, "./demo_hello.py")


except ImportError:
    sys.exit(1)
except Exception:
    import traceback
    traceback.print_exc()
    sys.exit(1)
