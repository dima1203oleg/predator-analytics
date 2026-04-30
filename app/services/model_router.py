from __future__ import annotations

import logging
import os

import aiohttp

from app.libs.core.config import settings

logger = logging.getLogger("service.model_router")


class ModelRouter:
    """Routes LLM requests to the appropriate provider based on policy, availability, and cost.
    Supports: Ollama (local), Gemini, Groq, Mistral, OpenAI.
    """

    def __init__(self, config_path: str | None = None):
        # We prefer settings from app.libs.core.config
        self.providers = {
            "ollama": settings.LLM_OLLAMA_BASE_URL,
            "gemini": settings.LLM_GEMINI_BASE_URL,
            "groq": settings.LLM_GROQ_BASE_URL,
            "openai": settings.LLM_OPENAI_BASE_URL,
            "lm_studio": os.getenv("LM_STUDIO_BASE_URL", "http://localhost:1234/v1"),
        }

        # Load Gemini keys (handle both single and multiple)
        gemini_keys = []
        env_keys = os.getenv("GEMINI_API_KEYS", "")
        if env_keys:
            gemini_keys = [k.strip() for k in env_keys.split(",") if k.strip()]
        if settings.GEMINI_API_KEY:
            gemini_keys.append(settings.GEMINI_API_KEY)

        self.api_keys = {
            "gemini": list(set(gemini_keys)),
            "groq": settings.GROQ_API_KEY,
            "openai": settings.OPENAI_API_KEY,
            "lm_studio": "not-needed",
        }
        self._current_gemini_key_idx = 0

    def _get_next_gemini_key(self) -> str | None:
        keys = self.api_keys.get("gemini", [])
        if not keys:
            return None
        key = keys[self._current_gemini_key_idx % len(keys)]
        self._current_gemini_key_idx += 1
        return key

    async def chat_completion(
        self, model: str, messages: list[dict[str, str]], temperature: float = 0.7
    ) -> str:
        """Routes request with automatic fallback: Groq -> Gemini -> Ollama."""
        provider = self._determine_provider(model)
        logger.info(f"Routing request for model '{model}' to primary provider '{provider}'")

        # 1. Attempt Primary
        try:
            response = await self._execute_provider_call(provider, model, messages, temperature)
            if not str(response).strip().startswith("Error:"):
                return response
            logger.warning(f"Primary provider {provider} failed: {response}")
        except Exception as e:
            logger.warning(f"Primary provider {provider} exception: {e}")

        # 2. Backup: Gemini (if not already tried)
        if provider != "gemini":
            logger.info("⚠️ Activating Failover Protocol: Switching to Gemini...")
            try:
                # Use a specific safe model for Gemini backup
                response = await self._call_gemini("gemini-1.5-flash", messages, temperature)
                if not str(response).strip().startswith("Error:"):
                    return response
                logger.warning(f"Backup provider Gemini failed: {response}")
            except Exception as e:
                logger.warning(f"Backup provider Gemini exception: {e}")

        # 3. Offline Backup: Ollama
        if provider != "ollama":
            logger.info("🔌 Activating Offline Protocol: Switching to Local Ollama...")
            try:
                return await self._call_ollama("mistral", messages, temperature)
            except Exception as e:
                return f"Error: All providers failed. Last error: {e}"

        return "Error: All providers failed."

    async def _execute_provider_call(
        self, provider: str, model: str, messages: list[dict[str, str]], temp: float
    ) -> str:
        if provider == "ollama":
            return await self._call_ollama(model, messages, temp)
        if provider == "gemini":
            return await self._call_gemini(model, messages, temp)
        if provider == "groq":
            return await self._call_groq(model, messages, temp)
        if provider == "openai":
            return await self._call_openai(model, messages, temp)
        if provider == "lm_studio":
            return await self._call_lm_studio(model, messages, temp)
        raise ValueError(f"Unknown provider: {provider}")

    def _determine_provider(self, model: str) -> str:
        model_lower = model.lower()
        if "lms" in model_lower or "local" in model_lower:
            return "lm_studio"
        if "gemini" in model_lower:
            return "gemini"
        if "gpt" in model_lower:
            return "openai"
        # Prefer Groq for Llama models (higher free tier limits)
        if "llama" in model_lower:
            if self.api_keys.get("groq"):
                return "groq"
            return "ollama"  # Fallback to local Ollama
        if "groq" in model_lower:
            return "groq"
        if "mistral" in model_lower or "qwen" in model_lower or "codestral" in model_lower:
            return "ollama"
        # Default to Groq if available (free tier), else Gemini
        if self.api_keys.get("groq"):
            return "groq"
        return "gemini"

    async def _call_gemini(
        self, model: str, messages: list[dict[str, str]], temperature: float
    ) -> str:
        api_key = self._get_next_gemini_key()
        if not api_key:
            return "Error: Gemini API key not configured"

        # Convert OpenAI-style messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        url = f"{self.providers['gemini']}/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": contents,
            "generationConfig": {"temperature": temperature, "maxOutputTokens": 2048},
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=payload) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        try:
                            return data["candidates"][0]["content"]["parts"][0]["text"]
                        except (KeyError, IndexError):
                            logger.exception(f"Unexpected Gemini response format: {data}")
                            return "Error: Malformed response from Gemini"
                    else:
                        error_text = await resp.text()
                        logger.error(f"Gemini error {resp.status}: {error_text}")
                        return f"Error: Gemini returned {resp.status}"
            except Exception as e:
                logger.exception(f"Gemini request failed: {e}")
                return f"Error: {e!s}"

    async def _call_groq(
        self, model: str, messages: list[dict[str, str]], temperature: float
    ) -> str:
        if not self.api_keys["groq"]:
            return "Error: Groq API key not configured"

        url = f"{self.providers['groq']}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_keys['groq']}",
            "Content-Type": "application/json",
        }
        payload = {"model": model, "messages": messages, "temperature": temperature}
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, headers=headers, json=payload) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data["choices"][0]["message"]["content"]
                    return f"Error: Groq returned {resp.status}"
            except Exception as e:
                return f"Error: {e!s}"

    async def _call_ollama(
        self, model: str, messages: list[dict[str, str]], temperature: float
    ) -> str:
        url = f"{self.providers['ollama']}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature},
        }
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=payload) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("message", {}).get("content", "")
                    return f"Error: Ollama returned {resp.status}"
            except Exception as e:
                return f"Error connecting to Ollama: {e!s}"

    async def _call_openai(
        self, model: str, messages: list[dict[str, str]], temperature: float
    ) -> str:
        if not self.api_keys["openai"]:
            return "Error: OpenAI API key not configured"
        # Standard OpenAI chat completion
        url = f"{self.providers['openai']}/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_keys['openai']}"}
        payload = {"model": model, "messages": messages, "temperature": temperature}
        async with (
            aiohttp.ClientSession() as session,
            session.post(url, headers=headers, json=payload) as resp,
        ):
            if resp.status == 200:
                data = await resp.json()
                return data["choices"][0]["message"]["content"]
            return f"Error: OpenAI returned {resp.status}"

    async def _call_lm_studio(
        self, model: str, messages: list[dict[str, str]], temperature: float
    ) -> str:
        """Call local LM Studio (OpenAI compatible)."""
        url = f"{self.providers['lm_studio']}/chat/completions"
        payload = {
            "model": model,  # LM Studio usually ignores this and uses the loaded model
            "messages": messages,
            "temperature": temperature,
        }
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=payload) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data["choices"][0]["message"]["content"]
                    error_text = await resp.text()
                    logger.error(f"LM Studio local error {resp.status}: {error_text}")
                    return f"Error: LM Studio returned {resp.status}. Переконайтеся, що сервер запущено на {self.providers['lm_studio']}"
            except Exception as e:
                logger.exception(f"Failed to connect to LM Studio: {e}")
                return "Error: Не вдалося підключитися до LM Studio. Перевірте, чи активовано Local Server."
