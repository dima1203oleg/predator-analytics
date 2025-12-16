"""
Base LLM Provider Interface
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

@dataclass
class LLMResponse:
    success: bool
    content: str
    provider: str
    model: str
    tokens_used: int = 0
    latency_ms: float = 0
    error: Optional[str] = None

class BaseLLMProvider(ABC):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    @abstractmethod
    async def generate(self, prompt: str, system: str = "", **kwargs) -> LLMResponse:
        """Generate text from prompt"""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass
