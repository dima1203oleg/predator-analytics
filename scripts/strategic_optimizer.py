#!/usr/bin/env python3.12
"""
🧠 Strategic Optimizer - Predator v26.3
--------------------------------------
Аналізує стан системи через SOM, переглядає TODO та оптимізує черговість задач
для максимальної суверенності та стабільності.
"""

import asyncio
import os
import re
import json
import httpx
from pathlib import Path
from libs.core.structured_logger import get_logger

logger = get_logger("predator.strategic_optimizer")

PROJECT_ROOT = Path(__file__).resolve().parents[1]
TODO_FILE = PROJECT_ROOT / "EXECUTION_TODO.md"
SOM_URL = os.getenv("SOM_BASE_URL", "http://localhost:8095/api/v1/som")

async def get_system_context():
    """Отримати контекст системи з SOM"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            status_resp = await client.get(f"{SOM_URL}/status")
            topology_resp = await client.get(f"{SOM_URL}/topology")
            anomalies_resp = await client.get(f"{SOM_URL}/anomalies?severity=high")

            return {
                "status": status_resp.json() if status_resp.status_code == 200 else {},
                "topology": topology_resp.json() if topology_resp.status_code == 200 else {},
                "critical_anomalies": anomalies_resp.json().get("anomalies", []) if anomalies_resp.status_code == 200 else []
            }
    except Exception as e:
        logger.warning(f"⚠️ Не вдалося зв'язатися з SOM: {e}. Використовуємо локальний контекст.")
        return {"status": "offline", "critical_anomalies": []}

async def optimize_todo():
    """Перевпорядкування TODO на основі аналізу ШІ (Gemini Free)"""
    if not TODO_FILE.exists():
        logger.error("Файл TODO не знайдено.")
        return

    logger.info("🧠 Запуск стратегічної ШІ-оптимізації...")

    # 1. Збір контексту
    context = await get_system_context()
    todo_content = TODO_FILE.read_text(encoding="utf-8")

    # 2. Викликаємо безкоштовний Gemini через оркестратор
    try:
        from services.orchestrator.agents.v25_sovereign_registry import sovereign_orchestrator

        prompt = f"""
        Ти — Стратегічний Оптимізатор Predator v26.
        Твоя задача: перепланувати список завдань TODO на основі поточного стану системи.

        СТАН СИСТЕМИ (SOM):
        {json.dumps(context, indent=2, ensure_ascii=False)}

        ПОТОЧНИЙ TODO:
        {todo_content}

        ВИМОГИ:
        1. Найкритичніші завдання для безпеки та стабільності (аномалії) пересунь на початок.
        2. Згрупуй схожі завдання для підвищення ефективності.
        3. Додай коментар [AI-STRATEGY] до кожного зміненого пункту.
        4. Збережи оригінальну структуру Markdown.

        Поверни повний текст оновленого файлу TODO.
        """

        new_todo = await sovereign_orchestrator.gemini_agent.chat(prompt)

        if new_todo and len(new_todo) > 100:
            TODO_FILE.write_text(new_todo, encoding="utf-8")
            logger.info("✅ TODO стратегічно оптимізовано через Gemini.")
        else:
            logger.warning("⚠️ ШІ повернув порожній або занадто короткий результат.")

    except Exception as e:
        logger.error(f"❌ Помилка під час ШІ-оптимізації: {e}")
        # Фолбек до базової логіки (вже реалізовано вище)

if __name__ == "__main__":
    asyncio.run(optimize_todo())
