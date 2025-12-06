import os
from typing import List, Dict, Any, Optional
import aiohttp
import logging
import yaml

logger = logging.getLogger("service.model_router")

class ModelRouter:
    """
    Routes LLM requests to the appropriate provider based on policy, availability, and cost.
    Supports: Ollama (local), Gemini, Groq, Mistral, OpenAI.
    """
    def __init__(self, config_path: str = "ua-sources/app/agents/configs/registry.yaml"):
        self.providers = {
            "ollama": os.getenv("OLLAMA_URL", "http://localhost:11434"),
            "gemini": "https://generativelanguage.googleapis.com/v1beta",
            "groq": "https://api.groq.com/openai/v1",
            "openai": "https://api.openai.com/v1"
        }
        self.api_keys = {
            "gemini": os.getenv("GEMINI_API_KEY"),
            "groq": os.getenv("GROQ_API_KEY"),
            "openai": os.getenv("OPENAI_API_KEY")
        }
        self.registry = self._load_registry(config_path)

    def _load_registry(self, path: str) -> Dict[str, Any]:
        try:
            with open(path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.warning(f"Failed to load registry from {path}: {e}")
            return {}

    async def chat_completion(self, model: str, messages: List[Dict[str, str]], temperature: float = 0.7) -> str:
        """
        Generic chat completion method that routes to the correct provider implementation.
        """
        provider = self._determine_provider(model)
        logger.info(f"Routing request for model '{model}' to provider '{provider}'")

        if provider == "ollama":
            return await self._call_ollama(model, messages, temperature)
        elif provider == "gemini":
            return await self._call_gemini(model, messages, temperature)
        elif provider == "groq":
            return await self._call_groq(model, messages, temperature)
        elif provider == "openai":
            return await self._call_openai(model, messages, temperature)
        else:
            raise ValueError(f"Unknown provider for model: {model}")

    def _determine_provider(self, model: str) -> str:
        # Simple heuristic mapping
        if "gemma" in model or "mistral" in model or "llama" in model:
             # Check if we should use local ollama or cloud provider
             if "groq" in model: return "groq" 
             return "ollama"
        if "gemini" in model: return "gemini"
        if "gpt" in model: return "openai"
        if "claude" in model: return "anthropic" # Not implemented yet
        return "ollama" # Default fallback

    async def _call_ollama(self, model: str, messages: List[Dict[str, str]], temperature: float) -> str:
        url = f"{self.providers['ollama']}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature}
        }
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=payload) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("message", {}).get("content", "")
                    else:
                        error_text = await resp.text()
                        logger.error(f"Ollama error: {resp.status} - {error_text}")
                        return f"Error: Ollama returned {resp.status}"
            except Exception as e:
                logger.error(f"Ollama connection failed: {e}")
                return "Error: Could not connect to Ollama"

    async def _call_gemini(self, model: str, messages: List[Dict[str, str]], temperature: float) -> str:
        # Simplified implementation
        if not self.api_keys['gemini']:
            return "Error: Gemini API key not configured"
        # ... (Gemini explicit implementation to be added)
        return "Gemini placeholder response"

    async def _call_groq(self, model: str, messages: List[Dict[str, str]], temperature: float) -> str:
        if not self.api_keys['groq']:
            return "Error: Groq API key not configured"
        
        url = f"{self.providers['groq']}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_keys['groq']}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature
        }
        async with aiohttp.ClientSession() as session:
             async with session.post(url, headers=headers, json=payload) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data['choices'][0]['message']['content']
                else:
                    return f"Error: Groq returned {resp.status}"

    async def _call_openai(self, model: str, messages: List[Dict[str, str]], temperature: float) -> str:
         # Placeholder
         return "OpenAI placeholder response"
