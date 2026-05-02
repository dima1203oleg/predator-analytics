import asyncio
import json
import random
from datetime import UTC, datetime
from typing import Any, List

from predator_common.logging import get_logger
from app.services.antigravity_orchestrator import orchestrator
from app.services.ai_service import AIService

logger = get_logger("core_api.wargaming")

class WarGamingEngine:
    """War-gaming Engine (v63.0-ELITE)
    Двигун для моделювання складних сценаріїв та оцінки ризиків.
    """

    def __init__(self):
        self.ai = AIService()
        self.active_scenarios = []

    async def generate_scenarios(self, tenant_id: str = None, context_data: dict = None) -> List[dict]:
        """Генерує актуальні сценарії загроз на основі поточних даних для конкретного тенданта."""
        prompt = f"""
        ПРОАНАЛІЗУЙ КОНТЕКСТ ТА ЗГЕНЕРУЙ 3 СТРАТЕГІЧНІ СЦЕНАРІЇ РИЗИКУ ДЛЯ МИТНИЦІ УКРАЇНИ.
        ДАНІ: {context_data or 'Стабільні показники'}
        
        Вимоги:
        1. Формат: JSON list.
        2. Поля: id, name, probability (0-100), impact (High/Med/Low), description, triggers.
        3. Мова: Українська.
        """
        
        try:
            # Спроба згенерувати через AI
            raw_response = await self.ai.generate_insight(prompt)
            # Очищення від markdown якщо є
            clean_json = raw_response.replace('```json', '').replace('```', '').strip()
            scenarios = json.loads(clean_json)
            self.active_scenarios = scenarios
            return scenarios
        except Exception as e:
            logger.warning(f"AI scenario generation failed, using fallback: {e}")
            return self._get_fallback_scenarios()

    def _get_fallback_scenarios(self) -> List[dict]:
        return [
            {
                "id": "WAR-01",
                "name": "Зрив зернового коридору",
                "probability": 45,
                "impact": "High",
                "description": "Зупинка експорту через порти Одеси. Очікуваний дефіцит валютної виручки.",
                "triggers": ["Блокада портів", "Ріст фрахту"]
            },
            {
                "id": "WAR-02",
                "name": "Енергетичний шантаж",
                "probability": 60,
                "impact": "High",
                "description": "Дефіцит пального через атаки на нафтобази. Ріст імпорту генераторів.",
                "triggers": ["Ціна нафти > $95", "Атаки на енергосистему"]
            }
        ]

    async def simulate_impact(self, scenario_id: str) -> dict:
        """Симулює вплив обраного сценарію на систему."""
        scenario = next((s for s in self.active_scenarios if s['id'] == scenario_id), None)
        if not scenario:
            scenario = self._get_fallback_scenarios()[0]

        # Додаємо задачу в Antigravity Orchestrator для аналізу агентами
        orchestrator.add_task(
            description=f"АНАЛІЗ ВПЛИВУ: {scenario['name']}. Прогнозування втрат бюджету та схем мінімізації.",
            priority="CRITICAL",
            max_budget=50.0
        )

        # Розрахунок впливу (симуляція)
        loss_estimate = random.randint(100, 500) * (scenario['probability'] / 100)
        
        return {
            "scenario": scenario['name'],
            "estimated_loss_mln_uah": round(loss_estimate, 2),
            "critical_nodes": ["Одеська митниця", "Енергетичний хаб Захід"],
            "counter_measures": [
                "Посилений контроль імпорту енергоносіїв",
                "Моніторинг цін на критичний імпорт"
            ],
            "status": "SIMULATED"
        }

wargaming_engine = WarGamingEngine()
