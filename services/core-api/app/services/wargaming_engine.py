from datetime import UTC, datetime
import json
import random
from typing import Any

from app.services.ai_service import AIService
from app.services.analytics_service import AnalyticsService
from app.services.antigravity_orchestrator import orchestrator
from predator_common.logging import get_logger

logger = get_logger("core_api.wargaming")

class MonteCarloSimulator:
    """Симулятор Монте-Карло для оцінки фінансових ризиків."""

    @staticmethod
    def run_simulation(
        base_loss: float,
        probability: float,
        iterations: int = 1000,
        volatility: float = 0.2
    ) -> dict[str, Any]:
        """Запускає ітераційну симуляцію можливих збитків."""
        results = []
        for _ in range(iterations):
            # Моделювання випадкового впливу через нормальний розподіл
            if random.random() * 100 <= probability:
                # Вплив = База * (1 + випадкова зміна)
                variation = random.gauss(0, volatility)
                loss = base_loss * (1 + variation)
                results.append(max(0, loss))
            else:
                results.append(0)

        if not results:
            return {"mean": 0, "p95": 0, "p99": 0, "max": 0}

        results.sort()
        count = len(results)

        return {
            "mean": round(sum(results) / count, 2),
            "p95": round(results[int(count * 0.95)], 2),
            "p99": round(results[int(count * 0.99)], 2),
            "max": round(max(results), 2),
            "iterations": iterations
        }

class WarGamingEngine:
    """War-gaming Engine (v63.0-ELITE)
    Двигун для моделювання складних сценаріїв та оцінки ризиків.
    """

    def __init__(self):
        self.ai = AIService()
        self.simulator = MonteCarloSimulator()
        self.analytics = AnalyticsService()
        self.active_scenarios = []

    async def generate_scenarios(self, tenant_id: str | None = None) -> list[dict]:
        """Генерує актуальні сценарії загроз на основі поточних даних ClickHouse."""
        # 1. Отримуємо реальні дані з ClickHouse
        real_stats = {}
        if tenant_id:
            real_stats = self.analytics.get_dashboard_stats(tenant_id)
            anomaly_trends = self.analytics.get_anomaly_trends(tenant_id)
            real_stats["anomaly_count"] = len(anomaly_trends.get("daily_counts", []))

        context_str = json.dumps(real_stats, ensure_ascii=False) if real_stats else "Стабільні показники"

        prompt = f"""
        ТИ - LEAD WAR-GAMER ПЛАТФОРМИ PREDATOR.
        ЗАВДАННЯ: ЗГЕНЕРУЙ 3 СТРАТЕГІЧНІ СЦЕНАРІЇ РИЗИКУ НА ОСНОВІ РЕАЛЬНОЇ СИТУАЦІЇ.

        РЕАЛЬНІ МЕТРИКИ (CLICKHOUSE): {context_str}

        ВИМОГИ ДО СЦЕНАРІЇВ:
        1. Формат: ТІЛЬКИ JSON list.
        2. Поля:
           - id: (напр. WAR-2026-001)
           - name: Назва сценарію
           - probability: (0-100)
           - base_impact_uah_mln: (очікувані збитки у млн грн)
           - impact_level: (High/Med/Low)
           - description: Детальний опис загрози
           - triggers: [список тригерів, що активують загрозу]
           - logic_base: (коротке пояснення, чому цей сценарій актуальний на основі даних)
        3. Мова: Українська.

        БУДЬ РЕАЛІСТИЧНИМ. Якщо імпорт падає — шукай загрози в логістиці. Якщо аномалії ростуть — моделюй корупційні схеми.
        """

        try:
            raw_response = await self.ai.generate_insight(prompt)
            clean_json = raw_response.replace('```json', '').replace('```', '').strip()
            scenarios = json.loads(clean_json)
            self.active_scenarios = scenarios
            return scenarios
        except Exception as e:
            logger.debug(f"AI scenario generation failed, using fallback: {e}")
            return self._get_fallback_scenarios()

    def _get_fallback_scenarios(self) -> list[dict]:
        return [
            {
                "id": "WAR-01",
                "name": "Зрив зернового коридору",
                "probability": 45,
                "base_impact_uah_mln": 450.0,
                "impact_level": "High",
                "description": "Зупинка експорту через порти Одеси. Очікуваний дефіцит валютної виручки.",
                "triggers": ["Блокада портів", "Ріст фрахту"]
            },
            {
                "id": "WAR-02",
                "name": "Енергетичний шантаж",
                "probability": 60,
                "base_impact_uah_mln": 280.0,
                "impact_level": "High",
                "description": "Дефіцит пального через атаки на нафтобази. Ріст імпорту генераторів.",
                "triggers": ["Ціна нафти > $95", "Атаки на енергосистему"]
            }
        ]

    async def simulate_scenario(self, scenario_id: str, iterations: int = 1000) -> dict:
        """Повна симуляція сценарію з використанням Монте-Карло та AI-агентів."""
        scenario = next((s for s in self.active_scenarios if s['id'] == scenario_id), None)
        if not scenario:
            scenario = next((s for s in self._get_fallback_scenarios() if s['id'] == scenario_id), self._get_fallback_scenarios()[0])

        # 1. Фізична симуляція збитків (Монте-Карло)
        base_impact = scenario.get('base_impact_uah_mln', 100.0)
        probability = scenario.get('probability', 50.0)

        mc_results = self.simulator.run_simulation(
            base_loss=base_impact,
            probability=probability,
            iterations=iterations
        )

        # 2. Агентурний аналіз (Orchestrator)
        orchestrator.add_task(
            description=f"STRATEGIC WAR-GAME: {scenario['name']}. Аналіз критичних вузлів та ланцюжків постачання.",
            priority="CRITICAL",
            max_budget=100.0,
            metadata={"scenario_id": scenario_id, "type": "war_game"}
        )

        # 3. Формування комплексного звіту
        return {
            "scenario": scenario,
            "monte_carlo": mc_results,
            "strategic_nodes": ["Одеський порт", "Західний кордон (вантажівки)"],
            "ai_agent_status": "ANALYZING",
            "timestamp": datetime.now(UTC).isoformat(),
            "recommendations": [
                "Диверсифікація логістичних маршрутів",
                "Створення стратегічного резерву пального",
                "Посилений моніторинг декларацій з ризиковими кодами"
            ]
        }

wargaming_engine = WarGamingEngine()
