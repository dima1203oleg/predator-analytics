#!/usr/bin/env python3.12
"""
🛡️ PREDATOR SELF-HEALER v27.0
------------------------------
Автономна імунна система. Виявляє помилки в логах та ініціює цикли автовиправлення.
"""

import asyncio
import os
import time
import json
from pathlib import Path
from libs.core.structured_logger import get_logger
from services.orchestrator.agents.v25_sovereign_registry import sovereign_orchestrator

logger = get_logger("predator.self_healer")

LOG_PATHS = [
    Path("logs/api_gateway.log"),
    Path("logs/autonomous_processor.log"),
    Path("logs/orchestrator.log")
]

class SelfHealer:
    def __init__(self):
        self.processed_errors = set()

    async def watch_logs(self):
        logger.info("📡 Імунна система запущена. Моніторинг системних логів...")
        while True:
            for log_path in LOG_PATHS:
                if log_path.exists():
                    try:
                        await self.check_log(log_path)
                    except Exception as e:
                        logger.error(f"Помилка при перевірці логу {log_path}: {e}")
            await asyncio.sleep(60) # Перевірка кожну хвилину

    async def check_log(self, path: Path):
        with open(path, "r", encoding="utf-8") as f:
            # Читаємо тільки останні 200 рядків
            lines = f.readlines()[-200:]

        for line in lines:
            if "ERROR" in line or "exception" in line.lower():
                error_hash = hash(line.strip())
                if error_hash not in self.processed_errors:
                    logger.warning(f"🚨 Виявлено критичну аномалію: {line[:100]}...")
                    await self.heal(line)
                    self.processed_errors.add(error_hash)

    async def heal(self, error_line: str):
        """Процес автономного ремонту"""
        logger.info("🛠️ Ініціалізація циклу самовідновлення...")

        try:
            # 1. Аналіз помилки через Gemini (Free API)
            analysis_prompt = f"Проаналізуй цю помилку з логів та запропонуй план виправлення коду: {error_line}"
            analysis = await sovereign_orchestrator.gemini_agent.chat(analysis_prompt)

            logger.info(f"🧠 План лікування: {analysis[:200]}...")

            # 2. Запуск циклу виправлення
            repair_task = f"FIX ERROR: {error_line}. STRATEGY: {analysis}"
            result = await sovereign_orchestrator.execute_comprehensive_cycle(repair_task)

            if result.get("status") == "success":
                logger.info("✅ Система успішно самовідновилася. Патч застосовано.")
                # 3. Запис в Truth Ledger про успішний ремонт
                await self.log_to_truth_ledger(error_line, "REPAIRED")
            else:
                logger.error("❌ Автовиправлення не вдалося. Потрібне втручання розробника.")

        except Exception as e:
            logger.error(f"Помилка під час лікування: {e}")

    async def log_to_truth_ledger(self, issue: str, status: str):
        try:
            # Mock виклику Truth Ledger
            logger.info(f"📜 Запис до реєстру подій: {status} -> {issue[:50]}")
        except:
            pass

if __name__ == "__main__":
    healer = SelfHealer()
    asyncio.run(healer.watch_logs())
