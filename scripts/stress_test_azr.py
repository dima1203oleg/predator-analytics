from __future__ import annotations

import asyncio
import json
import logging

from app.services.azr_engine import azr_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AZR_STRESS_TEST")

async def run_stress_test():
    logger.info("🔥 Запуск стрес-тесту двигуна AZR...")

    # 1. Симуляція 5 циклів
    for i in range(1, 6):
        logger.info(f"📍 Симуляція циклу {i}...")
        await azr_engine._run_cycle()

        # Перевірка розміру журналу аудиту
        if azr_engine.audit_log_path.exists():
            with open(azr_engine.audit_log_path) as f:
                logs = f.readlines()
                logger.info(f"📊 Записів у журналі аудиту: {len(logs)}")

        # Пауза
        await asyncio.sleep(2)

    # 2. Перевірка імунітету
    logger.info(f"🧬 Розмір сховища імунітету: {len(azr_engine.immunity.fingerprints)}")

    # 3. Фінальний статус
    status = azr_engine.get_status()
    logger.info(f"🏆 Фінальний статус: {json.dumps(status, indent=2, ensure_ascii=False)}")

if __name__ == "__main__":
    asyncio.run(run_stress_test())
