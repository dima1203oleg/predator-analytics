from __future__ import annotations

import asyncio
import os
import signal
import sys

# Add paths to ensure imports work
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services/api_gateway"))

import contextlib

from libs.core.structured_logger import get_logger

# Setup Logging
logger = get_logger("scripts.start_azr_autonomy")

async def main():

    try:
        from app.services.azr_engine import azr_engine

        # Перевірка стану двигуна
        azr_engine.get_status()


        # Визначення обробників сигналів для коректного завершення
        loop = asyncio.get_running_loop()
        stop_event = asyncio.Event()

        def handle_stop():
            azr_engine.is_running = False
            stop_event.set()

        loop.add_signal_handler(signal.SIGINT, handle_stop)
        loop.add_signal_handler(signal.SIGTERM, handle_stop)

        # Запуск циклу (ефективно назавжди)
        await azr_engine.start_autonomous_cycle(duration_hours=24000) # 1000 днів ~ назавжди

        # Підтримка роботи скрипту
        while not stop_event.is_set():
            if not azr_engine.is_running:
                await azr_engine.start_autonomous_cycle(duration_hours=24000)

            await asyncio.sleep(60)

    except ImportError:
        sys.exit(1)
    except Exception:
        sys.exit(1)

if __name__ == "__main__":
    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(main())
