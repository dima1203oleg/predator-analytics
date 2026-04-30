from __future__ import annotations

import logging
from typing import Any

from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentConfig(BaseModel):
    name: str
    model: str = "gemini-pro"
    temperature: float = 0.0
    tools: list[str] = []


class AgentResponse(BaseModel):
    agent_name: str
    result: Any
    metadata: dict[str, Any] = {}
    error: str | None = None


class BaseAgent:
    def __init__(self, config: AgentConfig):
        self.name = config.name
        self.config = config
        self.logger = logging.getLogger(f"agent.{self.name}")

    async def process(self, inputs: dict[str, Any]) -> AgentResponse:
        """Main entry point for the agent logic.
        Must be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement process()")

    async def health_check(self) -> bool:
        """Simple health check for the agent."""
        return True

    def _log_activity(self, message: str, level: str = "info"):
        log_fn = getattr(self.logger, level, None)
        if not callable(log_fn):
            log_fn = self.logger.info
        log_fn("[%s] %s", self.name, message)

    def _log_error(self, message: str):
        self.logger.error("[%s] ERROR: %s", self.name, message)
