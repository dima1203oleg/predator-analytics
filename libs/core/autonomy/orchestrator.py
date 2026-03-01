import asyncio
import logging
from typing import TYPE_CHECKING, Any, Dict, List


if TYPE_CHECKING:
    from libs.core.autonomy.agent_base import AutonomousAgent

    from .agent_base import AutonomousAgent


try:
    pass
except ImportError:
    pass

logger = logging.getLogger("predator.autonomy.orchestrator")


class AgentOrchestrator:
    """Orchestrates the lifecycle of autonomous agents in Predator Analytics v45.
    Ensures all agents are running and healthy.
    """

    def __init__(self):
        self.agents: list[AutonomousAgent] = []
        self._tasks: list[asyncio.Task] = []
        self.is_running = False

    def register_agent(self, agent: "AutonomousAgent"):
        """Register a new autonomous agent to the orchestrator."""
        self.agents.append(agent)
        logger.info(f"Registered agent: {agent.name}")

    async def start(self):
        """Start the autonomous loop for all registered agents."""
        if self.is_running:
            return

        self.is_running = True
        logger.info("Starting Agent Orchestrator...")

        for agent in self.agents:
            task = asyncio.create_task(agent.run_loop())
            self._tasks.append(task)

        logger.info(f"Successfully started {len(self.agents)} agents.")

    async def stop(self):
        """Safely stop all running agents."""
        self.is_running = False
        logger.info("Stopping Agent Orchestrator...")

        for agent in self.agents:
            agent.stop()

        # Optional: Wait for tasks to finish
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
            self._tasks = []

        logger.info("All autonomous agents stopped.")

    def get_stats(self) -> list[dict[str, Any]]:
        """Retrieve execution statistics from all agents."""
        return [
            {"name": agent.name, "stats": agent.stats, "is_running": agent.is_running}
            for agent in self.agents
        ]


# Global instance for easy access in FastAPI
orchestrator = AgentOrchestrator()
