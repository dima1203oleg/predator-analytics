from functools import lru_cache
from .agent_memory import AgentMemory
from .prompt_registry import PromptRegistry
from .litellm.litellm_manager import LiteLLMManager

@lru_cache()
def get_agent_memory() -> AgentMemory:
    return AgentMemory()

@lru_cache()
def get_prompt_registry() -> PromptRegistry:
    return PromptRegistry()

@lru_cache()
def get_litellm_manager() -> LiteLLMManager:
    return LiteLLMManager()

__all__ = [
    "AgentMemory", "get_agent_memory",
    "PromptRegistry", "get_prompt_registry",
    "LiteLLMManager", "get_litellm_manager"
]
