
from typing import Protocol, List, Dict, Any, Optional
from abc import abstractmethod
from dataclasses import dataclass
from datetime import datetime

class AgentPermission(Protocol):
    """Permissions granted to an agent."""
    code: str
    description: str

@dataclass
class AgentContext:
    """Context passed to agent execution."""
    execution_id: str
    token: str
    cli_path: str = "./predatorctl"

class BaseAgent(Protocol):
    """
    Contract for all Predator v26 Agents.
    Agents MUST use the CLI for mutations.
    Agents MUST output machine-readable logs.
    """

    name: str
    version: str
    required_permissions: List[str]

    @abstractmethod
    async def run(self, context: AgentContext) -> Dict[str, Any]:
        """Execute the agent loop or task."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Self-diagnostics."""
        ...

class AZRAgentContract(BaseAgent):
    """Specialized contract for Self-Healing Agents."""

    @abstractmethod
    async def propose_amendment(self, proposal_yaml: str) -> str:
        """Wraps `predatorctl azr propose`"""
        ...
