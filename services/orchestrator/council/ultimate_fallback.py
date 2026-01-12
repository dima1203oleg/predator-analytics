"""
Ultimate Multi-Provider Fallback System (Mixed Top CLI Stack Edition)
Aligns with CLI_STACK_MIXED_TOP_TECH_SPEC.md
"""
import logging
import os
from typing import Optional
import httpx

logger = logging.getLogger("models.ultimate_fallback")

class MixedCLIStackFallback:
    """
    Implementation of the Canonical Mixed CLI Stack as a fallback system.
    1. Gemini 2.5 (Planner/Strategic)
    2. Mistral Vibe (Codegen)
    3. Ollama (Offline Fallback)
    """

    def __init__(self):
        self.gemini_key = os.environ.get("GEMINI_API_KEY")
        self.mistral_key = os.environ.get("MISTRAL_API_KEY")
        self.groq_key = os.environ.get("GROQ_API_KEY")  # Groq - HIGH FREE TIER!
        self.ollama_url = os.environ.get("OLLAMA_BASE_URL", "http://host.docker.internal:11434")

        # Primary models - using models with HIGHER FREE TIER LIMITS
        # gemini-2.5-flash has only 20 req/day - TOO LOW!
        self.planner_model = "gemini-2.0-flash-exp"  # Higher limits
        self.groq_model = "llama-3.3-70b-versatile"  # FREE, fast, high limits
        self.codegen_model = "codestral-latest"  # Mistral

        # Use config model or safe default
        from libs.core.config import settings
        self.fallback_model = settings.OLLAMA_MODEL or "qwen2.5:latest"

    async def generate(self,
                      prompt: str,
                      system: Optional[str] = None,
                      temperature: float = 0.3,
                      max_tokens: int = 4000,
                      role: str = "planner") -> Optional[str]:
        """
        Main entry point for generation.
        Selects tool based on role and availability.
        """

        # 1. Strategic Role -> Try GROQ FIRST (FREE, HIGH LIMITS, FAST!)
        if role == "planner" or "analyze" in prompt.lower():
            if self.groq_key:
                try:
                    return await self._try_groq(prompt, system, temperature)
                except Exception as e:
                    logger.warning(f"⚠️ Groq failed: {e}. Trying Gemini...")

            # Fallback to Gemini only if Groq fails
            if self.gemini_key:
                try:
                    return await self._try_gemini(prompt, system, temperature)
                except Exception as e:
                    logger.warning(f"⚠️ Gemini failed: {e}. Falling back...")

        # 2. Code Role -> Mistral Vibe
        if role == "codegen" or "code" in prompt.lower() or "implement" in prompt.lower():
            if self.mistral_key:
                try:
                    return await self._try_mistral(prompt, system, temperature)
                except Exception as e:
                    logger.warning(f"⚠️ Mistral Vibe failed: {e}. Falling back...")

        # 3. Final Fallback -> Ollama (Offline-First)
        logger.warning(f"🏠 FALLBACK MODE: Primary tools failed. Using Ollama ({self.fallback_model})")
        return await self._try_ollama(prompt, system)

    async def _try_groq(self, prompt: str, system: str, temp: float) -> str:
        """Call Groq API - FREE, FAST, HIGH LIMITS!"""
        url = "https://api.groq.com/openai/v1/chat/completions"
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {self.groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.groq_model,
                    "messages": messages,
                    "temperature": temp,
                    "max_tokens": 4000
                }
            )
            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.status_code} - {response.text}")

            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def _try_gemini(self, prompt: str, system: str, temp: float) -> str:
        """Call Gemini API (fallback after Groq)"""
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.planner_model}:generateContent?key={self.gemini_key}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                json={"contents": [{"parts": [{"text": full_prompt}]}]}
            )
            if response.status_code != 200:
                raise Exception(f"Gemini API error: {response.status_code} - {response.text}")

            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    async def _try_mistral(self, prompt: str, system: str, temp: float) -> str:
        """Call Mistral API (Vibe CLI equivalent)"""
        url = "https://api.mistral.ai/v1/chat/completions"
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={"Authorization": f"Bearer {self.mistral_key}"},
                json={
                    "model": self.codegen_model,
                    "messages": messages,
                    "temperature": temp
                }
            )
            if response.status_code != 200:
                raise Exception(f"Mistral API error: {response.status_code} - {response.text}")

            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def _try_ollama(self, prompt: str, system: str) -> str:
        """Call Local Ollama (Offline First)"""
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                # Try internal docker network first
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.fallback_model,
                        "prompt": full_prompt,
                        "stream": False
                    }
                )
                if response.status_code == 200:
                    return response.json().get("response", "")
            except Exception:
                # Fallback to localhost if outside docker
                response = await client.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": self.fallback_model,
                        "prompt": full_prompt,
                        "stream": False
                    }
                )
                return response.json().get("response", "")
        raise Exception("Ollama unreachable")

# Global instance replacement
_ultimate_fallback = None

def get_ultimate_fallback():
    """Get global mixed CLI stack instance"""
    global _ultimate_fallback
    if _ultimate_fallback is None:
        _ultimate_fallback = MixedCLIStackFallback()
    return _ultimate_fallback
