from __future__ import annotations

import asyncio
import logging
import os
import signal
import sys


# Add paths to ensure imports work
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services/api-gateway"))

import contextlib

from libs.core.structured_logger import get_logger


# Setup Logging
logger = get_logger("scripts.start_azr_autonomy")

async def main():
    print("🚀 ІНІЦІАЛІЗАЦІЯ СУВЕРЕННОЇ АВТОНОМІЇ AZR V28...")

    try:
        from app.services.azr_engine import azr_engine

        # Перевірка стану двигуна
        status = azr_engine.get_status()
        print(f"ℹ️  Статус двигуна: {status}")

        print("⚡ АКТИВАЦІЯ БЕЗПЕРЕРВНОГО АВТОНОМНОГО ЦИКЛУ...")

        # Визначення обробників сигналів для коректного завершення
        loop = asyncio.get_running_loop()
        stop_event = asyncio.Event()

        def handle_stop():
            print("\n🛑 Зупинка двигуна AZR...")
            azr_engine.is_running = False
            stop_event.set()

        loop.add_signal_handler(signal.SIGINT, handle_stop)
        loop.add_signal_handler(signal.SIGTERM, handle_stop)

        # Запуск циклу (ефективно назавжди)
        await azr_engine.start_autonomous_cycle(duration_hours=24000) # 1000 днів ~ назавжди

        # Підтримка роботи скрипту
        while not stop_event.is_set():
            if not azr_engine.is_running:
                print("⚠️ Двигун припинив роботу, спроба перезапуску...")
                await azr_engine.start_autonomous_cycle(duration_hours=24000)

            await asyncio.sleep(60)
            print("💓 Серцебиття AZR: Активно")

    except ImportError as e:
        print(f"❌ КРИТИЧНА ПОМИЛКА ІМПОРТУ: {e}")
        print("Перевірте шлях до Python та залежності.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ ФАТАЛЬНА ПОМИЛКА: {e}")
        sys.exit(1)

if __name__ == "__main__":
    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(main())
