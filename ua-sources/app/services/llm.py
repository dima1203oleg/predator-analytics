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
import asyncio
import random
from ..core.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"
    GROQ = "groq"
    MISTRAL = "mistral"
    OPENROUTER = "openrouter"
    HUGGINGFACE = "huggingface"
    COHERE = "cohere"
    TOGETHER = "together"


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
    
    def _get_keys(self, env_key: str, setting_key: Optional[str]) -> List[str]:
        """Helper to parse API keys from env or settings (supports comma-separated)"""
        raw_key = setting_key or os.getenv(env_key)
        if not raw_key:
            return []
        return [k.strip() for k in raw_key.split(",") if k.strip()]

    def _init_providers(self):
        """Initialize available providers based on API keys"""
        openai_keys = self._get_keys("OPENAI_API_KEY", settings.OPENAI_API_KEY)
        if openai_keys:
            self.providers["openai"] = {
                "base_url": settings.LLM_OPENAI_BASE_URL,
                "model": "gpt-4-turbo-preview",
                "api_keys": openai_keys
            }
        
        gemini_keys = self._get_keys("GEMINI_API_KEY", settings.GEMINI_API_KEY)
        if gemini_keys:
            self.providers["gemini"] = {
                "base_url": settings.LLM_GEMINI_BASE_URL,
                "model": "gemini-1.5-pro",
                "api_keys": gemini_keys
            }
        
        anthropic_keys = self._get_keys("ANTHROPIC_API_KEY", settings.ANTHROPIC_API_KEY)
        if anthropic_keys:
            self.providers["anthropic"] = {
                "base_url": settings.LLM_ANTHROPIC_BASE_URL,
                "model": "claude-3-sonnet-20240229",
                "api_keys": anthropic_keys
            }
        
        groq_keys = self._get_keys("GROQ_API_KEY", settings.GROQ_API_KEY)
        if groq_keys:
            self.providers["groq"] = {
                "base_url": settings.LLM_GROQ_BASE_URL,
                "model": "llama3-70b-8192",
                "api_keys": groq_keys
            }
            
        mistral_keys = self._get_keys("MISTRAL_API_KEY", settings.MISTRAL_API_KEY)
        if mistral_keys:
            self.providers["mistral"] = {
                "base_url": settings.LLM_MISTRAL_BASE_URL,
                "model": "mistral-large-latest",
                "api_keys": mistral_keys
            }
            
        openrouter_keys = self._get_keys("OPENROUTER_API_KEY", settings.OPENROUTER_API_KEY)
        if openrouter_keys:
            self.providers["openrouter"] = {
                "base_url": settings.LLM_OPENROUTER_BASE_URL,
                "model": "anthropic/claude-3-opus",
                "api_keys": openrouter_keys
            }
            
        hf_keys = self._get_keys("HUGGINGFACE_API_KEY", settings.HUGGINGFACE_API_KEY)
        if hf_keys:
            self.providers["huggingface"] = {
                "base_url": settings.LLM_HUGGINGFACE_BASE_URL,
                "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
                "api_keys": hf_keys
            }
            
        cohere_keys = self._get_keys("COHERE_API_KEY", settings.COHERE_API_KEY)
        if cohere_keys:
            self.providers["cohere"] = {
                "base_url": settings.LLM_COHERE_BASE_URL,
                "model": "command-r-plus",
                "api_keys": cohere_keys
            }
            
        together_keys = self._get_keys("TOGETHER_API_KEY", settings.TOGETHER_API_KEY)
        if together_keys:
            self.providers["together"] = {
                "base_url": settings.LLM_TOGETHER_BASE_URL,
                "model": "meta-llama/Llama-3-70b-chat-hf",
                "api_keys": together_keys
            }
        
        # Local Ollama is always available if running
        self.providers["ollama"] = {
            "base_url": settings.LLM_OLLAMA_BASE_URL,
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
    
    async def assess_complexity(self, prompt: str) -> str:
        """
        Analyze prompt complexity using a fast model (Groq/Mistral).
        Returns: 'simple', 'medium', 'complex'
        """
        # Prefer Groq for speed, fall back to Mistral or Gemini
        fast_provider = "groq" if "groq" in self.providers else "gemini"
        
        system_prompt = (
            "You are a classification system. Analyze the complexity of the user query. "
            "Output ONLY one word: 'simple' (fact retrieval, basic math), "
            "'medium' (summarization, simple reasoning), or 'complex' (multi-step analysis, creative writing, code generation)."
        )
        
        try:
            response = await self.generate(
                prompt=prompt,
                system=system_prompt,
                provider=fast_provider,
                max_tokens=10
            )
            complexity = response.content.lower().strip()
            if complexity in ["simple", "medium", "complex"]:
                return complexity
            return "medium" # Default
        except Exception:
            return "medium" # Fallback

    async def run_council(self, prompt: str, system: str, max_tokens: int) -> LLMResponse:
        """
        Run the LLM Council: Query multiple models and synthesize the best components.
        Judge: OpenAI (GPT-4) or best available.
        Members: Groq (Llama3), Mistral, Gemini.
        """
        # Define Council Members
        members = []
        if "groq" in self.providers: members.append("groq")
        if "gemini" in self.providers: members.append("gemini")
        if "cohere" in self.providers: members.append("cohere")
        if "together" in self.providers: members.append("together")
        if "mistral" in self.providers: members.append("mistral")
        
        # Take top 3 unique members (Prefer Groq, Gemini, Cohere/Together for diversity)
        members = list(set(members))[:3]
        if not members:
            return await self.generate(prompt, system)

        # Run in parallel
        tasks = [
            self.generate(prompt, system, provider=m, max_tokens=max_tokens)
            for m in members
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        valid_responses = [r for r in results if isinstance(r, LLMResponse) and r.success]
        
        if not valid_responses:
            return LLMResponse(success=False, content="", provider="council", model="council", error="All council members failed")
            
        # Synthesize (The Chairman)
        # Prefer Gemini or Groq as Judge (Fast and Smart Free Models) rather than OpenAI
        judge_provider = "gemini" if "gemini" in self.providers else ("groq" if "groq" in self.providers else "openai")
        
        synthesis_prompt = "You are the Chairman of the AI Council. Here are the responses from council members to the user's query:\n\n"
        
        for i, resp in enumerate(valid_responses):
            synthesis_prompt += f"--- Member {i+1} ({resp.provider}) ---\n{resp.content}\n\n"
            
        synthesis_prompt += (
            "Instructions:\n"
            "1. Synthesize a single, superior answer by combining the best parts of each response.\n"
            "2. Correct any factual errors found in one response using the others.\n"
            "3. Maintain the tone requested by the user.\n"
            "4. Do NOT mention 'Member 1' or 'Member 2' in the final output. Just give the answer."
        )
        
        synthesis_response = await self.generate(
            prompt=synthesis_prompt,
            system="You are a wise synthesizer of information.",
            provider=judge_provider,
            max_tokens=max_tokens
        )
        
        synthesis_response.provider = "council"
        synthesis_response.model = f"council-{len(valid_responses)}-members"
        
        return synthesis_response

    async def generate_with_routing(
        self,
        prompt: str,
        system: str = "",
        mode: str = "auto", # auto, fast, precise, council
        preferred_provider: Optional[str] = None,
        max_tokens: int = 2048,
        temperature: float = 0.7
    ) -> LLMResponse:
        """
        Smart generation with routing logic
        """
        # 0. Manual Override
        if preferred_provider:
            return await self.generate(prompt, system, provider=preferred_provider, max_tokens=max_tokens, temperature=temperature)

        # 1. Routing Logic
        if mode == "council":
            return await self.run_council(prompt, system, max_tokens)
            
        if mode == "fast":
            # Prefer Groq, then Mistral, then Gemini
            for p in ["groq", "mistral", "gemini"]:
                if p in self.providers:
                    return await self.generate(prompt, system, provider=p, max_tokens=max_tokens, temperature=temperature)
        
        if mode == "precise":
            # Prefer OpenAI, then Anthropic, then Gemini
            for p in ["openai", "anthropic", "gemini"]:
                if p in self.providers:
                    return await self.generate(prompt, system, provider=p, max_tokens=max_tokens, temperature=temperature)

        # 2. Auto Mode (Complexity Analysis)
        if mode == "auto":
            complexity = await self.assess_complexity(prompt)
            if complexity == "simple":
                # Use Fast
                provider = "groq" if "groq" in self.providers else settings.LLM_DEFAULT_PROVIDER
            elif complexity == "medium":
                # Use Balanced (Gemini or Default)
                provider = "gemini" if "gemini" in self.providers else settings.LLM_DEFAULT_PROVIDER
            else: # Complex
                # Use Precise or Council (if configured, but let's stick to Precise for now to save tokens)
                provider = "openai" if "openai" in self.providers else settings.LLM_DEFAULT_PROVIDER
                
            return await self.generate(prompt, system, provider=provider, max_tokens=max_tokens, temperature=temperature)

        # Fallback
        return await self.generate(prompt, system, max_tokens=max_tokens, temperature=temperature)

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
        elif "groq" in self.providers:
            selected_provider = "groq"
        elif "mistral" in self.providers:
            selected_provider = "mistral"
        elif "together" in self.providers:
            selected_provider = "together"
        elif "cohere" in self.providers:
            selected_provider = "cohere"
        elif "huggingface" in self.providers:
            selected_provider = "huggingface"
        elif "openrouter" in self.providers:
            selected_provider = "openrouter"
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
            elif selected_provider in ["groq", "mistral", "openrouter", "together"]:
                # These providers use OpenAI-compatible API structure
                response = await self._call_openai_compatible(prompt, system, config, max_tokens, temperature, provider_name=selected_provider)
            elif selected_provider == "cohere":
                response = await self._call_cohere(prompt, system, config, max_tokens, temperature)
            elif selected_provider == "huggingface":
                response = await self._call_huggingface(prompt, system, config, max_tokens, temperature)
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
            
            # Rotate keys
            api_key = random.choice(config["api_keys"])
            
            response = await client.post(
                url,
                params={"key": api_key},
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
            
            # Rotate keys
            api_key = random.choice(config["api_keys"])
            
            response = await client.post(
                f"{config['base_url']}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
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
            # Rotate keys
            api_key = random.choice(config["api_keys"])

            response = await client.post(
                f"{config['base_url']}/messages",
                headers={
                    "x-api-key": api_key,
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
    
    async def _call_openai_compatible(
        self, prompt: str, system: str, config: Dict, max_tokens: int, temperature: float, provider_name: str
    ) -> LLMResponse:
        """Call OpenAI-compatible APIs (Groq, Mistral, OpenRouter)"""
        async with httpx.AsyncClient() as client:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            
            # Rotate keys
            api_key = random.choice(config["api_keys"])
            
            headers = {"Authorization": f"Bearer {api_key}"}
            
            # Special handling for OpenRouter (needs headers)
            if provider_name == "openrouter":
                headers["HTTP-Referer"] = "https://predator-analytics.io"
                headers["X-Title"] = "Predator Analytics"
            
            response = await client.post(
                f"{config['base_url']}/chat/completions",
                headers=headers,
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
                provider=provider_name,
                model=config["model"],
                tokens_used=data.get("usage", {}).get("total_tokens", 0)
            )

    async def _call_cohere(
        self, prompt: str, system: str, config: Dict, max_tokens: int, temperature: float
    ) -> LLMResponse:
        """Call Cohere API"""
        async with httpx.AsyncClient() as client:
            api_key = random.choice(config["api_keys"])
            
            response = await client.post(
                f"{config['base_url']}/chat",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": config["model"],
                    "message": f"{system}\n\n{prompt}" if system else prompt,
                    "temperature": temperature,
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                success=True,
                content=data["text"],
                provider="cohere",
                model=config["model"]
            )

    async def _call_huggingface(
        self, prompt: str, system: str, config: Dict, max_tokens: int, temperature: float
    ) -> LLMResponse:
        """Call Hugging Face Inference API"""
        async with httpx.AsyncClient() as client:
            api_key = random.choice(config["api_keys"])
            url = f"{config['base_url']}/{config['model']}"
            
            full_prompt = f"<s>[INST] {system}\n\n{prompt} [/INST]" if system else f"<s>[INST] {prompt} [/INST]"
            
            response = await client.post(
                url,
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "inputs": full_prompt,
                    "parameters": {
                        "max_new_tokens": max_tokens,
                        "temperature": temperature,
                        "return_full_text": False
                    }
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            
            # HF returns list of dicts
            text = data[0].get("generated_text", "")
            
            return LLMResponse(
                success=True,
                content=text,
                provider="huggingface",
                model=config["model"]
            )


# Singleton instance
llm_service = LLMService()
