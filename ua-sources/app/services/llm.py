"""
LLM Service - Multi-provider LLM integration
Supports OpenAI, Gemini, Anthropic, and local models
"""
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
import httpx
import logging
import os

logger = logging.getLogger(__name__)


class LLMProvider(Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"


@dataclass
class LLMResponse:
    success: bool
    content: str
    provider: str
    model: str
    tokens_used: int = 0
    latency_ms: float = 0
    error: Optional[str] = None


class LLMService:
    """
    Multi-provider LLM service with fallback support
    """
    
    def __init__(self):
        self.providers: Dict[str, Dict[str, Any]] = {}
        self._init_providers()
    
    def _init_providers(self):
        """Initialize available providers based on API keys"""
        if os.getenv("OPENAI_API_KEY"):
            self.providers["openai"] = {
                "base_url": "https://api.openai.com/v1",
                "model": "gpt-4-turbo-preview",
                "api_key": os.getenv("OPENAI_API_KEY")
            }
        
        if os.getenv("GEMINI_API_KEY"):
            self.providers["gemini"] = {
                "base_url": "https://generativelanguage.googleapis.com/v1beta",
                "model": "gemini-1.5-pro",
                "api_key": os.getenv("GEMINI_API_KEY")
            }
        
        if os.getenv("ANTHROPIC_API_KEY"):
            self.providers["anthropic"] = {
                "base_url": "https://api.anthropic.com/v1",
                "model": "claude-3-sonnet-20240229",
                "api_key": os.getenv("ANTHROPIC_API_KEY")
            }
        
        # Local Ollama is always available if running
        self.providers["ollama"] = {
            "base_url": "http://localhost:11434/api",
            "model": "llama3",
            "api_key": None
        }
    
    def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get list of available providers"""
        return [
            {
                "id": name,
                "name": name.title(),
                "model": config["model"],
                "available": True
            }
            for name, config in self.providers.items()
        ]
    
    async def generate(
        self,
        prompt: str,
        system: str = "",
        provider: Optional[str] = None,
        max_tokens: int = 2048,
        temperature: float = 0.7
    ) -> LLMResponse:
        """
        Generate response using specified or default provider
        
        Args:
            prompt: User prompt
            system: System prompt
            provider: Specific provider to use (optional)
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature
        """
        import time
        start_time = time.time()
        
        # Select provider
        if provider and provider in self.providers:
            selected_provider = provider
        elif "gemini" in self.providers:
            selected_provider = "gemini"
        elif "openai" in self.providers:
            selected_provider = "openai"
        else:
            return LLMResponse(
                success=False,
                content="",
                provider="none",
                model="none",
                error="No LLM provider available"
            )
        
        config = self.providers[selected_provider]
        
        try:
            if selected_provider == "gemini":
                response = await self._call_gemini(prompt, system, config, max_tokens, temperature)
            elif selected_provider == "openai":
                response = await self._call_openai(prompt, system, config, max_tokens, temperature)
            elif selected_provider == "anthropic":
                response = await self._call_anthropic(prompt, system, config, max_tokens, temperature)
            else:
                response = await self._call_ollama(prompt, system, config, max_tokens, temperature)
            
            latency = (time.time() - start_time) * 1000
            response.latency_ms = latency
            return response
            
        except Exception as e:
            logger.error(f"LLM error with {selected_provider}: {e}")
            return LLMResponse(
                success=False,
                content="",
                provider=selected_provider,
                model=config["model"],
                error=str(e)
            )
    
    async def _call_gemini(
        self, prompt: str, system: str, config: Dict, max_tokens: int, temperature: float
    ) -> LLMResponse:
        """Call Google Gemini API"""
        async with httpx.AsyncClient() as client:
            url = f"{config['base_url']}/models/{config['model']}:generateContent"
            
            contents = []
            if system:
                contents.append({"role": "user", "parts": [{"text": f"System: {system}"}]})
            contents.append({"role": "user", "parts": [{"text": prompt}]})
            
            response = await client.post(
                url,
                params={"key": config["api_key"]},
                json={
                    "contents": contents,
                    "generationConfig": {
                        "maxOutputTokens": max_tokens,
                        "temperature": temperature
                    }
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            return LLMResponse(
                success=True,
                content=text,
                provider="gemini",
                model=config["model"]
            )
    
    async def _call_openai(
        self, prompt: str, system: str, config: Dict, max_tokens: int, temperature: float
    ) -> LLMResponse:
        """Call OpenAI API"""
        async with httpx.AsyncClient() as client:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            
            response = await client.post(
                f"{config['base_url']}/chat/completions",
                headers={"Authorization": f"Bearer {config['api_key']}"},
                json={
                    "model": config["model"],
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                success=True,
                content=data["choices"][0]["message"]["content"],
                provider="openai",
                model=config["model"],
                tokens_used=data.get("usage", {}).get("total_tokens", 0)
            )
    
    async def _call_anthropic(
        self, prompt: str, system: str, config: Dict, max_tokens: int, temperature: float
    ) -> LLMResponse:
        """Call Anthropic API"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config['base_url']}/messages",
                headers={
                    "x-api-key": config["api_key"],
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": config["model"],
                    "max_tokens": max_tokens,
                    "system": system,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                success=True,
                content=data["content"][0]["text"],
                provider="anthropic",
                model=config["model"]
            )
    
    async def _call_ollama(
        self, prompt: str, system: str, config: Dict, max_tokens: int, temperature: float
    ) -> LLMResponse:
        """Call local Ollama"""
        async with httpx.AsyncClient() as client:
            full_prompt = f"{system}\n\n{prompt}" if system else prompt
            
            response = await client.post(
                f"{config['base_url']}/generate",
                json={
                    "model": config["model"],
                    "prompt": full_prompt,
                    "stream": False
                },
                timeout=120.0
            )
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                success=True,
                content=data.get("response", ""),
                provider="ollama",
                model=config["model"]
            )


# Singleton instance
llm_service = LLMService()
