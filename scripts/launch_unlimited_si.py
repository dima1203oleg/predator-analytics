#!/usr/bin/env python3.12
"""
🛡️ PREDATOR v25 - Тригер необмеженого автовдосконалення (Launch SI Loop)
----------------------------------------------------------------------
Цей скрипт запускає нескінченний цикл покращення системи через 4 CLI агенти.
Використовує Python 3.12 та повну українізацію.
"""

import asyncio
import logging
import sys
import os

# Додаємо кореневу директорію до шляху
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'services/api-gateway'))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("predator.launcher")

async def main():
    logger.info("🚀 Ініціалізація системи необмеженого автовдосконалення...")

    try:
        from app.services.training_service import self_improvement_service
        logger.info("✅ Сервіс завантажено. Запуск циклу...")

        # Запуск нескінченного циклу
        await self_improvement_service.start_endless_loop()

        logger.info("🔄 Цикл активовано. Система працює в автономному режимі.")

        # Тримаємо скрипт запущеним
        while True:
            await asyncio.sleep(3600)

    except ImportError as e:
        logger.error(f"❌ Помилка імпорту: {e}. Переконайтеся, що ви в корені проекту.")
    except Exception as e:
        logger.error(f"❌ Фатальна помилка: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        asyncio.run(main())
    else:
        print("💡 Використовуйте: python3.12 scripts/launch_unlimited_si.py --force")
        print("⚠️ Це запустить автономний цикл прямо в консолі.")
