#!/usr/bin/env python3.12
from __future__ import annotations

import sys


# ⚜️ ETERNAL RUNTIME GUARD
if sys.version_info < (3, 12):
    print("\n❌ FATAL: PREDATOR REQUIRES PYTHON 3.12.", file=sys.stderr)
    sys.exit(1)

"""🚀 PREDATOR: Llama 3.1 8B Endless Self-Improvement Trigger.
-------------------------------------------------------
This script explicitly initiates the autonomous self-improvement loop
configured for the Llama 3.1 8B Instruct model.
"""
import asyncio
from datetime import datetime
import os
from pathlib import Path
import sys
import time


# Add project root to sys.path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "services" / "api-gateway"))

from app.services.training_service import self_improvement_service
from libs.core.config import settings


def print_header():
    print("\033[1;35m" + "="*60 + "\033[0m")
    print("\033[1;36m" + "   PREDATOR: ENDLESS SELF-IMPROVEMENT LOOP v45.0" + "\033[0m")
    print("\033[1;35m" + "="*60 + "\033[0m")
    print(f"\033[1;37m   CORE ENGINE: \033[1;32m{settings.OLLAMA_MODEL}\033[0m")
    print("\033[1;37m   PROVIDER:    \033[1;32mOLLAMA (Local Edge Cluster)\033[0m")
    print(f"\033[1;37m   TIMESTAMP:   \033[1;34m{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\033[0m")
    print("\033[1;35m" + "-"*60 + "\033[0m")

async def run_first_cycle():
    print("\033[1;33m[1/3] Ініціалізація циклу самовдосконалення...\033[0m")
    await asyncio.sleep(1)

    print("\033[1;33m[2/3] Виконання тестового циклу (Phase: Genesis)...\033[0m")
    try:
        # We run the actual service logic
        result = await self_improvement_service.run_single_cycle()

        print("\033[1;32m[3/3] Цикл успішно завершено!\033[0m")
        print("\033[1;35m" + "-"*60 + "\033[0m")
        print("\033[1;37m   Результати оптимізації:\033[0m")
        print(f"   - Loss:     \033[1;31m{result['loss']}\033[0m")
        print(f"   - Accuracy: \033[1;32m{result['accuracy']*100}%\033[0m")
        print(f"   - Epoch:    \033[1;34m{result['epoch']}\033[0m")
        print("\033[1;35m" + "-"*60 + "\033[0m")

    except Exception as e:
        print(f"\033[1;31m❌ Помилка виконання циклу: {e}\033[0m")
        return False
    return True

async def start_background_loop():
    print("\033[1;36m🔄 Запуск фонового процесу 'Endless Loop'...\033[0m")
    await self_improvement_service.start_endless_loop()
    print("\033[1;32m✅ Background service [SelfImprovement] is now ACTIVE and running in the background.\033[0m")

async def main():
    print_header()
    success = await run_first_cycle()
    if success:
        await start_background_loop()
        print("\n\033[1;97mСистема Predator v45 | Neural Analyticsтепер знаходиться в режимі автономного самонавчання.\033[0m")
        print("\033[1;90mЛоги доступні через: tail -f services/api_gateway/app.log (structured JSON)\033[0m\n")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\033[1;31mПроцес перервано користувачем.\033[0m")
