"""
REPUTATION AGENT (Оцінювач Репутації)
=====================================
Відстежує дії інших агентів та нараховує "соціальний кредит".
"""

from typing import Dict
from datetime import datetime

try:
    from libs.core.structured_logger import get_logger
except ImportError:
    import logging
    def get_logger(name): return logging.getLogger(name)

logger = get_logger("agent.reputation")

class ReputationAgent:
    def __init__(self):
        self.scores: Dict[str, float] = {}
        self.default_score = 100.0

    async def update_score(self, agent_name: str, delta: float, reason: str):
        """Оновлює рейтинг агента"""
        current = self.scores.get(agent_name, self.default_score)
        new_score = max(0.0, min(200.0, current + delta))

        self.scores[agent_name] = new_score

        logger.info(f"REPUTATION: {agent_name} score updated to {new_score:.1f} ({delta:+}). Reason: {reason}")

    async def get_reputation(self, agent_name: str) -> float:
        return self.scores.get(agent_name, self.default_score)

# Експорт
reputation_agent = ReputationAgent()
