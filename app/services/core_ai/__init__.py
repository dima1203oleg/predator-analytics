from functools import lru_cache
from .agent_memory import AgentMemory
from .prompt_registry import PromptRegistry

@lru_cache()
def get_agent_memory() -> AgentMemory:
    return AgentMemory()

@lru_cache()
def get_prompt_registry() -> PromptRegistry:
    return PromptRegistry()

__all__ = [
    "AgentMemory", "get_agent_memory",
    "PromptRegistry", "get_prompt_registry"
]
