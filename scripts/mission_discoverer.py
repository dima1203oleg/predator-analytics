#!/usr/bin/env python3.12
"""
🚀 PREDATOR MISSION DISCOVERER v27.1
------------------------------------
Генератор автономних цілей. Шукає шляхи для покращення системи та ставить нові місії.
"""

import asyncio
import os
import json
import httpx
from pathlib import Path
from libs.core.structured_logger import get_logger
from services.orchestrator.agents.v25_sovereign_registry import sovereign_orchestrator

logger = get_logger("predator.mission_discoverer")

SOM_URL = os.getenv("SOM_BASE_URL", "http://localhost:8095/api/v1/som")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8000/api/v1")

class MissionDiscoverer:
    async def analyze_and_propose(self):
        logger.info("🔭 Аналіз горизонту для нових місій...")

        # 1. Отримуємо контекст системи
        context = await self._get_system_context()

        # 2. Використовуємо ШІ для пошуку можливостей покращення
        proposal = await self._generate_proposals(context)

        if proposal and "missions" in proposal:
            for mission in proposal["missions"]:
                await self._create_mission(mission)

    async def _get_system_context(self):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                status = await client.get(f"{SOM_URL}/status")
                anomalies = await client.get(f"{SOM_URL}/anomalies?limit=10")
                stats = await client.get(f"{API_GATEWAY_URL}/stats")

                return {
                    "health": status.json() if status.status_code == 200 else {},
                    "recent_anomalies": anomalies.json().get("anomalies", []) if anomalies.status_code == 200 else [],
                    "system_stats": stats.json() if stats.status_code == 200 else {}
                }
        except Exception as e:
            logger.warning(f"⚠️ Контекст частковий: {e}")
            return {"health": "degraded", "recent_anomalies": []}

    async def _generate_proposals(self, context):
        prompt = f"""
        Ти — Стратегічний Мислитель Predator v27.
        На основі стану системи, запропонуй 1-2 нові місії для авто-вдосконалення.

        КОНТЕКСТ:
        {json.dumps(context, indent=2, ensure_ascii=False)}

        ВИМОГИ:
        - Місії мають бути практичними (код, дані, безпека).
        - Формат JSON: {{"missions": [{{"title": "..", "description": "..", "priority": "high/medium", "category": "evolution/security/data"}}]}}
        - Мова: Українська.
        """

        try:
            response = await sovereign_orchestrator.gemini_agent.chat(prompt)
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            logger.error(f"❌ Помилка генерації пропозицій: {e}")
        return None

    async def _create_mission(self, mission_data):
        logger.info(f"🆕 Створення нової місії: {mission_data['title']}")
        try:
            async with httpx.AsyncClient() as client:
                # В реальній системі тут виклик API створення місії
                # Для автономного режиму ми також додаємо це в TODO_FILE як стратегічну ціль
                from scripts.strategic_optimizer import TODO_FILE
                if TODO_FILE.exists():
                    current_todo = TODO_FILE.read_text(encoding="utf-8")
                    new_entry = f"\n### 🎯 АВТО-МІСІЯ: {mission_data['title']}\n- **Опис:** {mission_data['description']}\n- **Пріоритет:** {mission_data['priority']}\n- **Клас:** {mission_data['category']}\n"
                    TODO_FILE.write_text(current_todo + new_entry, encoding="utf-8")
                    logger.info("✅ Місія інтегрована в стратегічний план TODO.")
        except Exception as e:
            logger.error(f"❌ Не вдалося зареєструвати місію: {e}")

if __name__ == "__main__":
    discoverer = MissionDiscoverer()
    asyncio.run(discoverer.analyze_and_propose())
