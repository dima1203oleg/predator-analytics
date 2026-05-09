import asyncio
import contextlib
import logging
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from libs.core.autonomy.agent_base import AutonomousAgent

logger = logging.getLogger("predator.autonomy.orchestrator")

class AgentOrchestrator:
    """
    Оркестратор автономних агентів PREDATOR Analytics v61.0-ELITE.
    Керує життєвим циклом агентів, забезпечуючи їх стабільну роботу та моніторинг.
    """

    def __init__(self):
        self.agents: list["AutonomousAgent"] = []
        self._tasks: list[asyncio.Task] = []
        self.is_running = False

    def register_agent(self, agent: "AutonomousAgent"):
        """Реєстрація нового автономного агента в системі."""
        self.agents.append(agent)
        logger.info(f"✅ Зареєстровано агента: {agent.name}")

    async def start(self):
        """Запуск циклу виконання для всіх зареєстрованих агентів."""
        if self.is_running:
            return

        self.is_running = True
        logger.info("🚀 Запуск Оркестратора Агентів...")

        for agent in self.agents:
            task = asyncio.create_task(agent.run_loop())
            self._tasks.append(task)

        logger.info(f"✅ Успішно запущено {len(self.agents)} агентів.")

    async def stop(self):
        """Безпечна зупинка всіх працюючих агентів."""
        self.is_running = False
        logger.info("🛑 Зупинка Оркестратора Агентів...")

        for agent in self.agents:
            agent.stop()

        # Очікування завершення всіх активних завдань
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
            self._tasks = []

        logger.info("🏁 Усі автономні агенти зупинені.")

    def get_stats(self) -> list[dict[str, Any]]:
        """Отримання статистики виконання від усіх агентів."""
        return [
            {
                "name": agent.name, 
                "stats": agent.stats, 
                "is_running": agent.is_running,
                "node": "SOVEREIGN"
            }
            for agent in self.agents
        ]


# Глобальний екземпляр для доступу через FastAPI (Singleton)
orchestrator = AgentOrchestrator()
