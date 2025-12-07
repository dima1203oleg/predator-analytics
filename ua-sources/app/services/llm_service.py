
import os
import logging
import json
import aiohttp
from typing import List, Dict, Any, Optional

logger = logging.getLogger("service.llm")

class LLMService:
    """
    Interface to LLM providers (Ollama, OpenAI, etc.).
    Defaults to internal Ollama instance on Kubernetes.
    """
    
    def __init__(self):
        # Default to K8s service name, fallback to localhost for dev
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.default_model = os.getenv("LLM_MODEL", "mistral") # mistral is smaller/faster for default

    async def generate(self, prompt: str, system_prompt: str = None, model: str = None) -> str:
        """
        Generate text completion.
        """
        model = model or self.default_model
        
        # Try Ollama first
        try:
            return await self._generate_ollama(prompt, system_prompt, model)
        except Exception as e:
            logger.warning(f"Ollama generation failed: {e}. Falling back to mock/openai.")
            if self.openai_key:
                return await self._generate_openai(prompt, system_prompt)
            return self._generate_mock(prompt)

    async def _generate_ollama(self, prompt: str, system: str, model: str) -> str:
        url = f"{self.ollama_host}/api/generate"
        
        full_prompt = prompt
        if system:
            full_prompt = f"System: {system}\nUser: {prompt}"
            
        payload = {
            "model": model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_ctx": 4096
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=60) as response:
                if response.status != 200:
                    text = await response.text()
                    raise Exception(f"Ollama error {response.status}: {text}")
                
                data = await response.json()
                return data.get("response", "")

    async def _generate_openai(self, prompt: str, system: str) -> str:
        # TODO: Implement OpenAI fallback
        return "OpenAI fallback not implemented yet."

    def _generate_mock(self, prompt: str) -> str:
        return f"[MOCK LLM] Processed: {prompt[:50]}..."

# Singleton
llm_service = LLMService()

def get_llm_service():
    return llm_service
