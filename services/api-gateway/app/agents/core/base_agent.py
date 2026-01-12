from typing import Any, Dict, List, Optional
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentConfig(BaseModel):
    name: str
    model: str = "gemini-pro"
    temperature: float = 0.0
    tools: List[str] = []

class AgentResponse(BaseModel):
    agent_name: str
    result: Any
    metadata: Dict[str, Any] = {}
    error: Optional[str] = None

class BaseAgent:
    def __init__(self, config: AgentConfig):
        self.name = config.name
        self.config = config
        self.logger = logging.getLogger(f"agent.{self.name}")

    async def process(self, inputs: Dict[str, Any]) -> AgentResponse:
        """
        Main entry point for the agent logic.
        Must be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement process()")

    async def health_check(self) -> bool:
        """
        Simple health check for the agent.
        """
        return True

    def _log_activity(self, message: str, level: str = "info"):
        log_fn = getattr(self.logger, level, None)
        if not callable(log_fn):
            log_fn = self.logger.info
        log_fn(f"[{self.name}] {message}")

    def _log_error(self, message: str):
        self.logger.error(f"[{self.name}] ERROR: {message}")
