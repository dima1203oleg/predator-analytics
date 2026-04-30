from functools import lru_cache

from .agent_memory import AgentMemory
from .litellm.litellm_manager import LiteLLMManager
from .prompt_registry import PromptRegistry


@lru_cache
def get_agent_memory() -> AgentMemory:
    return AgentMemory()

@lru_cache
def get_prompt_registry() -> PromptRegistry:
    return PromptRegistry()

@lru_cache
def get_litellm_manager() -> LiteLLMManager:
    return LiteLLMManager()

__all__ = [
    "AgentMemory",
    "LiteLLMManager",
    "PromptRegistry",
    "get_agent_memory",
    "get_litellm_manager",
    "get_prompt_registry"
]
