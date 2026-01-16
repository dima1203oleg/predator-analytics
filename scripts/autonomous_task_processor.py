#!/usr/bin/env python3.12
"""
🤖 Predator v26.2 - Autonomous Task Processor (God Mode)
---------------------------------------------------------
Reads EXECUTION_TODO.md and executes tasks using the Sovereign Orchestrator.
System operates with FULL AUTONOMY.
"""

import asyncio
import os
import re
import sys
import json
import httpx
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from services.orchestrator.agents.v25_sovereign_registry import sovereign_orchestrator
from libs.core.structured_logger import get_logger

logger = get_logger("predator.autonomous_processor")

TODO_FILE = PROJECT_ROOT / "EXECUTION_TODO.md"
STRATEGIC_OPTIMIZER = PROJECT_ROOT / "scripts/strategic_optimizer.py"
MISSION_DISCOVERER = PROJECT_ROOT / "scripts/mission_discoverer.py"

async def run_mission_discovery():
    """Пошук нових стратегічних цілей"""
    logger.info("🔭 Запуск пошуку нових місій...")
    try:
        process = await asyncio.create_subprocess_exec(
            sys.executable, str(MISSION_DISCOVERER),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
        logger.info("🧠 Нові місії додано до горизонту планування.")
    except Exception as e:
        logger.error(f"❌ Помилка пошуку місій: {e}")

async def run_chaos_sprint():
    """Запуск короткого стрес-тесту для перевірки незламності"""
    logger.info("🔥 Ініціалізація Еволюційного Стресу (Chaos Sprint)...")
    try:
        async with httpx.AsyncClient() as client:
            await client.post("http://localhost:8095/api/v1/som/chaos/spike", params={"duration": 15})
        logger.info("✅ Стрес-тест запущено. Моніторинг адаптивності...")
    except:
        pass

async def run_strategic_optimization():
    """Запуск стратегічного планування перед виконанням завдань"""
    logger.info("📡 Запуск стратегічного планувальника...")
    try:
        process = await asyncio.create_subprocess_exec(
            sys.executable, str(STRATEGIC_OPTIMIZER),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        if process.returncode == 0:
            logger.info("🧠 Стратегічне планування завершено.")
        else:
            logger.warning(f"⚠️ Оптимізатор завершився з кодом {process.returncode}: {stderr.decode()}")
    except Exception as e:
        logger.error(f"❌ Не вдалося запустити оптимізатор: {e}")

async def process_todos():
    # Крок 0: Пошук нових можливостей
    await run_mission_discovery()

    # Крок 0.1: Стратегічне планування
    await run_strategic_optimization()

    # Крок 0.2: Шанс на Chaos Sprint (10% імовірність для антикрихкості)
    import random
    if random.random() < 0.10:
        await run_chaos_sprint()

    if not TODO_FILE.exists():
        logger.error(f"Файл TODO не знайдено за шляхом: {TODO_FILE}")
        return

    content = TODO_FILE.read_text(encoding="utf-8")

    # Simple regex to find tasks that are not checked (e.g. - [ ])
    # We look for tasks in P0 and P1 primarily
    pattern = r"### (\d+)\) (.*?)\n(.*?)(?=\n###|\n##|$)"
    matches = re.finditer(pattern, content, re.DOTALL)

    tasks_processed = 0

    for match in matches:
        task_num = match.group(1)
        task_title = match.group(2)
        task_details = match.group(3).strip()

        # Check if already completed (simple check: if it's already marked in the text somehow,
        # but EXECUTION_TODO.md doesn't use [x] yet. Let's look at the content again.)

        full_task_desc = f"TASK {task_num}: {task_title}\nDETAILS:\n{task_details}"

        logger.info(f"🚀 Обробка завдання {task_num}: {task_title}")

        try:
            # Виконання через Sovereign Orchestrator
            result = await sovereign_orchestrator.execute_comprehensive_cycle(full_task_desc)

            if result.get("status") == "success":
                logger.info(f"✅ Завдання {task_num} завершено успішно!")
                tasks_processed += 1
                # Позначення як виконане (опціонально)
            else:
                logger.warning(f"⚠️ Завдання {task_num} провалено: {result.get('message')}")

        except Exception as e:
            logger.error(f"❌ Помилка під час обробки завдання {task_num}: {e}")
            # Продовжуємо наступне завдання у режимі God Mode
            continue

    logger.info(f"🏁 Автономна обробка завершена. Оброблено завдань: {tasks_processed}")

def load_env():
    env_file = PROJECT_ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ[key.strip()] = value.strip()

if __name__ == "__main__":
    load_env()
    # Ensure SOVEREIGN_AUTO_APPROVE is set for this process
    os.environ["SOVEREIGN_AUTO_APPROVE"] = "true"
    asyncio.run(process_todos())
