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
import json
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
    XAI = "xai"  # Grok
    DEEPSEEK = "deepseek"


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
        
        # Load dynamic keys first
        self.dynamic_config = {}
        try:
            config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dynamic_keys.json")
            if os.path.exists(config_path):
                with open(config_path, "r") as f:
                    self.dynamic_config = json.load(f)
                logger.info(f"Loaded dynamic keys from {config_path}")
        except Exception as e:
            logger.error(f"Failed to load dynamic keys: {e}")

        # ============================================
        # VERIFIED WORKING KEYS (From testing 2025-12-08)
        # All models are FREE or have free tier
        # ============================================
        
        # Groq - FAST & FREE (3 working keys)
        groq_keys = []
        # Add dynamic Groq keys
        groq_keys.extend(self.dynamic_config.get("groq", []))
        
        self.providers["groq"] = {
            "base_url": "https://api.groq.com/openai/v1",
            "model": self.dynamic_config.get("providers_config", {}).get("groq", "llama-3.1-8b-instant"),
            "models_available": [
                "llama-3.1-8b-instant",    # FREE - fast
                "llama-3.1-70b-versatile", # FREE - smart
                "mixtral-8x7b-32768",      # FREE - balanced
                "gemma2-9b-it"             # FREE - compact
            ],
            "api_keys": list(set(groq_keys)) # Deduplicate
        }
        
        # Mistral - RELIABLE & FREE (3 working keys)
        mistral_keys = []
        mistral_keys.extend(self.dynamic_config.get("mistral", []))

        self.providers["mistral"] = {
            "base_url": "https://api.mistral.ai/v1",
            "model": self.dynamic_config.get("providers_config", {}).get("mistral", "mistral-tiny"),
            "models_available": ["mistral-tiny", "mistral-small", "mistral-medium"],
            "api_keys": list(set(mistral_keys))
        }

        # OpenRouter - ACCESS TO MANY FREE MODELS
        openrouter_keys = []
        openrouter_keys.extend(self.dynamic_config.get("openrouter", []))
        
        self.providers["openrouter"] = {
            "base_url": "https://openrouter.ai/api/v1",
            "model": self.dynamic_config.get("providers_config", {}).get("openrouter", "mistralai/mistral-7b-instruct:free"),
            "models_available": ["mistralai/mistral-7b-instruct:free", "google/gemma-7b-it:free"],
            "api_keys": list(set(openrouter_keys))
        }

        # Together.ai - QUALITY FREE MODELS
        together_keys = []
        together_keys.extend(self.dynamic_config.get("together", []))
        
        self.providers["together"] = {
            "base_url": "https://api.together.xyz/v1",
            "model": self.dynamic_config.get("providers_config", {}).get("together", "mistralai/Mixtral-8x7B-Instruct-v0.1"),
            "models_available": ["mistralai/Mixtral-8x7B-Instruct-v0.1", "meta-llama/Llama-3-8b-chat-hf"],
            "api_keys": list(set(together_keys))
        }
        
        # Gemini - POWERFUL & FREE (1 working key + dynamic)
        gemini_keys = []
        gemini_keys.extend(self.dynamic_config.get("gemini", []))        # Mistral - RELIABLE & FREE (3 working keys)
        mistral_keys = []
        mistral_keys.extend(self.dynamic_config.get("mistral", []))

        self.providers["mistral"] = {
            "base_url": "https://api.mistral.ai/v1",
            "model": self.dynamic_config.get("providers_config", {}).get("mistral", "mistral-small-latest"),
            "models_available": [
                "mistral-small-latest",    # FREE tier
                "open-mistral-7b",         # FREE 
                "open-mixtral-8x7b",       # FREE
                "mistral-tiny"             # Legacy FREE
            ],
            "api_keys": list(set(mistral_keys))
        }

        # OpenRouter - ACCESS TO MANY FREE MODELS
        openrouter_keys = []
        openrouter_keys.extend(self.dynamic_config.get("openrouter", []))
        
        self.providers["openrouter"] = {
            "base_url": "https://openrouter.ai/api/v1",
            "model": "mistralai/mistral-7b-instruct:free",
            "models_available": [
                "mistralai/mistral-7b-instruct:free",  # FREE
                "meta-llama/llama-3.2-3b-instruct:free", # FREE
                "qwen/qwen-2-7b-instruct:free",        # FREE
                "google/gemma-2-9b-it:free"            # FREE
            ],
            "api_keys": list(set(openrouter_keys))
        }

        # Together.ai - QUALITY FREE MODELS
        together_keys = []
        together_keys.extend(self.dynamic_config.get("together", []))
        
        self.providers["together"] = {
            "base_url": "https://api.together.xyz/v1",
            "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
            "models_available": [
                "mistralai/Mixtral-8x7B-Instruct-v0.1",
                "meta-llama/Llama-3-8b-chat-hf",
                "Qwen/Qwen2.5-7B-Instruct-Turbo"
            ],
            "api_keys": list(set(together_keys))
        }
        
        # Gemini - POWERFUL & FREE (1 working key + dynamic)
        gemini_keys = []
        gemini_keys.extend(self.dynamic_config.get("gemini", []))
        
        self.providers["gemini"] = {
            "base_url": "https://generativelanguage.googleapis.com/v1beta",
            "model": self.dynamic_config.get("providers_config", {}).get("gemini", "gemini-2.5-flash"),
            "models_available": [
                "gemini-2.5-flash",        # Primary
                "gemini-2.5-pro",          # Secondary
                "gemini-1.5-flash"         # Fallback
            ],
            "api_keys": list(set(gemini_keys))
        }
        
        # Ollama - LOCAL FALLBACK (Remote server)
        self.providers["ollama"] = {
            "base_url": "http://46.219.108.236:11434/api",
            "model": "mistral",
            "models_available": ["mistral", "llama3", "codellama"],
            "api_key": None
        }
        
        # ... (Environment loading code remains same but adds to these) ...

    def _save_dynamic_config(self):
        """Save current dynamic configuration to file"""
        try:
            config = {
                "providers_config": {}
            }
            
            # Collect keys and models
            for name, provider in self.providers.items():
                # Save model
                config["providers_config"][name] = provider["model"]
                
                # Save keys (only dynamic ones ideally, but saving all is easier for now, though insecure for git)
                # Better approach: Load existing dynamic, append new ones, save back.
                # For simplicity here, we assume add_api_key updates self.providers AND we save valid keys to dynamic
                if "api_keys" in provider:
                     config[name] = provider["api_keys"]

            config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dynamic_keys.json")
            with open(config_path, "w") as f:
                json.dump(config, f, indent=4)
            logger.info("Saved dynamic configuration")
        except Exception as e:
            logger.error(f"Failed to save dynamic config: {e}")

    def add_api_key(self, provider: str, key: str) -> bool:
        """Add new API key to provider and persist"""
        if provider not in self.providers:
            return False
        if "api_keys" not in self.providers[provider]:
            self.providers[provider]["api_keys"] = []
        if key not in self.providers[provider]["api_keys"]:
            self.providers[provider]["api_keys"].append(key)
            self._save_dynamic_config()  # SAVE ON ADD
            logger.info(f"Added new key to {provider} and saved")
            return True
        return False

    def set_provider_model(self, provider: str, model: str) -> bool:
        """Set default model for provider and persist"""
        if super().set_provider_model(provider, model): # use parent/internal logic
             self._save_dynamic_config() # SAVE ON CHANGE
             return True
        # ... duplication of logic to ensure saving ...
        if provider not in self.providers:
            return False
        self.providers[provider]["model"] = model
        self._save_dynamic_config()
        logger.info(f"Set {provider} model to: {model} and saved")
        return True
        
        # ============================================
        # Optional providers from environment
        # ============================================
            
        # Allow additional keys from environment
        env_groq = self._get_keys("GROQ_API_KEY", settings.GROQ_API_KEY)
        if env_groq:
            self.providers["groq"]["api_keys"].extend(env_groq)
            
        env_mistral = self._get_keys("MISTRAL_API_KEY", settings.MISTRAL_API_KEY)
        if env_mistral:
            self.providers["mistral"]["api_keys"].extend(env_mistral)
            
        env_gemini = self._get_keys("GEMINI_API_KEY", settings.GEMINI_API_KEY)
        if env_gemini:
            self.providers["gemini"]["api_keys"].extend(env_gemini)
            
        openrouter_env = self._get_keys("OPENROUTER_API_KEY", settings.OPENROUTER_API_KEY)
        if openrouter_env:
            self.providers["openrouter"]["api_keys"].extend(openrouter_env)
            
        together_env = self._get_keys("TOGETHER_API_KEY", settings.TOGETHER_API_KEY)
        if together_env:
            self.providers["together"]["api_keys"].extend(together_env)
        
        # DeepSeek (if provided and has balance)
        deepseek_keys = self._get_keys("DEEPSEEK_API_KEY", settings.DEEPSEEK_API_KEY)
        if deepseek_keys:
            self.providers["deepseek"] = {
                "base_url": settings.LLM_DEEPSEEK_BASE_URL,
                "model": "deepseek-chat",
                "api_keys": deepseek_keys
            }
        
        # xAI/Grok (if becomes available)
        xai_keys = self._get_keys("XAI_API_KEY", settings.XAI_API_KEY)
        if xai_keys:
            self.providers["xai"] = {
                "base_url": settings.LLM_XAI_BASE_URL,
                "model": "grok-beta",
                "api_keys": xai_keys
            }

    
    def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get list of available providers with full info"""
        return [
            {
                "id": name,
                "name": name.title(),
                "model": config["model"],
                "models_available": config.get("models_available", [config["model"]]),
                "keys_count": len(config.get("api_keys", [1])),
                "available": True
            }
            for name, config in self.providers.items()
        ]
    
    # ============================================
    # KEY MANAGEMENT METHODS
    # ============================================
    
    def add_api_key(self, provider: str, key: str) -> bool:
        """Add new API key to provider"""
        if provider not in self.providers:
            return False
        if "api_keys" not in self.providers[provider]:
            self.providers[provider]["api_keys"] = []
        if key not in self.providers[provider]["api_keys"]:
            self.providers[provider]["api_keys"].append(key)
            logger.info(f"Added new key to {provider}, total: {len(self.providers[provider]['api_keys'])}")
            return True
        return False
    
    def remove_api_key(self, provider: str, key: str) -> bool:
        """Remove API key from provider"""
        if provider not in self.providers:
            return False
        if "api_keys" in self.providers[provider] and key in self.providers[provider]["api_keys"]:
            self.providers[provider]["api_keys"].remove(key)
            return True
        return False
    
    def get_keys_info(self, provider: str) -> Dict[str, Any]:
        """Get info about provider keys (masked)"""
        if provider not in self.providers:
            return {"error": "Provider not found"}
        keys = self.providers[provider].get("api_keys", [])
        return {
            "provider": provider,
            "count": len(keys),
            "keys": [k[:8] + "..." + k[-4:] if len(k) > 16 else k[:4] + "..." for k in keys]
        }
    
    # ============================================
    # MODEL SELECTION METHODS
    # ============================================
    
    def set_provider_model(self, provider: str, model: str) -> bool:
        """Set default model for provider"""
        if provider not in self.providers:
            return False
        available = self.providers[provider].get("models_available", [])
        if model in available or not available:
            self.providers[provider]["model"] = model
            logger.info(f"Set {provider} model to: {model}")
            return True
        return False
    
    def get_provider_models(self, provider: str) -> List[str]:
        """Get available models for provider"""
        if provider not in self.providers:
            return []
        return self.providers[provider].get("models_available", [self.providers[provider]["model"]])
    
    def get_settings(self) -> Dict[str, Any]:
        """Get all LLM settings"""
        return {
            "providers": {
                name: {
                    "model": config["model"],
                    "models_available": config.get("models_available", []),
                    "keys_count": len(config.get("api_keys", [1])),
                    "base_url": config["base_url"]
                }
                for name, config in self.providers.items()
            },
            "default_priority": ["groq", "gemini", "mistral", "together", "openrouter", "ollama"]
        }
    
    def update_settings(self, settings: Dict[str, Any]) -> bool:
        """Update LLM settings"""
        try:
            if "provider_models" in settings:
                for provider, model in settings["provider_models"].items():
                    self.set_provider_model(provider, model)
            if "add_keys" in settings:
                for provider, keys in settings["add_keys"].items():
                    for key in keys:
                        self.add_api_key(provider, key)
            return True
        except Exception as e:
            logger.error(f"Failed to update settings: {e}")
            return False
    
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

    async def run_council(
        self, 
        prompt: str, 
        system: str, 
        max_tokens: int,
        enable_review: bool = True
    ) -> LLMResponse:
        """
        Advanced LLM Council inspired by Karpathy's implementation:
        
        Stage 1: First opinions from multiple free models
        Stage 2: Peer review and ranking (optional)
        Stage 3: Chairman synthesis
        
        Free models used:
        - Groq (Llama 3 70B) - Fast & Smart
        - Google Gemini - Creative & Analytical  
        - Cohere Command R+ - Strong reasoning
        - Together.ai (Llama 3 70B) - Alternative
        - Mistral - Balanced
        - HuggingFace (Mixtral) - Open source
        """
        import time
        start_time = time.time()
        
        # ============================================
        # STAGE 1: Collect opinions from council members
        # ============================================
        
        # Define all available free models (prioritize best free ones)
        potential_members = []
        
        # Tier 1: Best available models
        if "openrouter" in self.providers:
            potential_members.append(("openrouter", "mistralai/mistral-7b-instruct", 1))
        if "mistral" in self.providers:
            potential_members.append(("mistral", "mistral-tiny", 1))
        if "together" in self.providers:
            potential_members.append(("together", "mistralai/Mixtral-8x7B-Instruct-v0.1", 1))
        
        # Tier 2: Fallbacks
        if "ollama" in self.providers:
            potential_members.append(("ollama", "mistral", 2))
        
        # Select top 3-5 diverse members (prefer different providers)
        potential_members.sort(key=lambda x: x[2])  # Sort by tier
        members = [m[0] for m in potential_members[:5]]  # Take top 5
        
        if not members:
            logger.warning("No council members available, using fallback")
            return await self.generate(prompt, system)
        
        logger.info(f"Council members: {members}")
        
        # Run in parallel to get first opinions
        tasks = [
            self.generate(prompt, system, provider=m, max_tokens=max_tokens)
            for m in members
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter valid responses
        valid_responses = [
            r for r in results 
            if isinstance(r, LLMResponse) and r.success
        ]
        
        if not valid_responses:
            return LLMResponse(
                success=False, 
                content="", 
                provider="council", 
                model="council",
                error="All council members failed"
            )
        
        logger.info(f"Council opinions collected: {len(valid_responses)}/{len(members)}")
        
        # ============================================
        # STAGE 2: Peer Review and Ranking (если включено)
        # ============================================
        
        rankings = {}
        if enable_review and len(valid_responses) > 1:
            logger.info("Starting peer review stage...")
            
            for i, reviewer_resp in enumerate(valid_responses):
                # Prepare anonymized responses for review
                review_prompt = "You are reviewing responses from other AI models. Rate each response for accuracy, insight, and completeness.\n\n"
                review_prompt += f"Question: {prompt}\n\n"
                
                for j, resp in enumerate(valid_responses):
                    if i != j:  # Don't review own response
                        review_prompt += f"Response {j+1}:\n{resp.content[:500]}...\n\n"
                
                review_prompt += """
Rate each response (except your own) on a scale of 1-10 for:
- Accuracy
- Insight  
- Completeness

Format: Response X: Score Y (brief reason)
Keep it very brief."""
                
                try:
                    review = await self.generate(
                        review_prompt,
                        system="You are an objective AI reviewer.",
                        provider=valid_responses[i].provider,
                        max_tokens=200
                    )
                    
                    if review.success:
                        # Parse scores (simple regex)
                        import re
                        scores = re.findall(r'Response\s+(\d+):\s*(?:Score\s+)?(\d+)', review.content)
                        for resp_idx, score in scores:
                            resp_idx = int(resp_idx) - 1
                            if resp_idx in rankings:
                                rankings[resp_idx].append(int(score))
                            else:
                                rankings[resp_idx] = [int(score)]
                                
                except Exception as e:
                    logger.error(f"Review error from {valid_responses[i].provider}: {e}")
            
            logger.info(f"Rankings collected: {rankings}")
        
        # ============================================
        # STAGE 3: Chairman Synthesis
        # ============================================
        
        # Choose best free model as Chairman
        # Prefer Gemini (creative synthesis) or Groq (fast and smart)
        if "gemini" in self.providers:
            chairman = "gemini"
        elif "groq" in self.providers:
            chairman = "groq"
        elif "cohere" in self.providers:
            chairman = "cohere"
        else:
            chairman = members[0]
        
        # Build synthesis prompt with rankings if available
        synthesis_prompt = """You are the Chairman of the AI Council. Multiple AI models have provided answers to the user's question.

Your task: Synthesize a superior final answer by:
1. Combining the best insights from each response
2. Correcting any factual errors
3. Adding your own analysis where helpful
4. Maintaining the appropriate tone

User Question: """ + prompt + "\n\n"
        
        # Add responses with rankings
        for i, resp in enumerate(valid_responses):
            avg_score = sum(rankings.get(i, [0])) / max(len(rankings.get(i, [1])), 1)
            score_text = f" [Peer Score: {avg_score:.1f}/10]" if rankings else ""
            
            synthesis_prompt += f"""
--- Model {i+1} ({resp.provider}){score_text} ---
{resp.content}

"""
        
        synthesis_prompt += """
Instructions:
- Create ONE superior answer combining the best parts
- Do NOT mention "Model 1" or response numbers in your output
- Correct errors using other responses
- Be concise but comprehensive
- Match the user's language (Ukrainian if needed)

Final Answer:"""
        
        synthesis_response = await self.generate(
            prompt=synthesis_prompt,
            system="You are a wise synthesizer who creates the best possible answer from multiple sources.",
            provider=chairman,
            max_tokens=max_tokens
        )
        
        # Enhance metadata
        synthesis_response.provider = "council"
        synthesis_response.model = f"council-{len(valid_responses)}members-{chairman}-chairman"
        synthesis_response.latency_ms = (time.time() - start_time) * 1000
        
        logger.info(f"Council synthesis completed in {synthesis_response.latency_ms:.0f}ms")
        
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
            # Prefer Mistral, then Together, then OpenRouter
            for p in ["mistral", "together", "openrouter"]:
                if p in self.providers:
                    return await self.generate(prompt, system, provider=p, max_tokens=max_tokens, temperature=temperature)
        
        if mode == "precise":
            # Prefer OpenRouter (access to best models), then Mistral
            for p in ["openrouter", "mistral", "together"]:
                if p in self.providers:
                    return await self.generate(prompt, system, provider=p, max_tokens=max_tokens, temperature=temperature)

        # 2. Auto Mode (Complexity Analysis)
        if mode == "auto":
            # Default to OpenRouter or Mistral
            provider = "openrouter" if "openrouter" in self.providers else ("mistral" if "mistral" in self.providers else "ollama")
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
        
        # Select provider with smart fallback priority
        # Priority: Fast & Free → Powerful & Free → Paid
        if provider and provider in self.providers:
            selected_provider = provider
        elif "groq" in self.providers:  # #1 Fast & Free
            selected_provider = "groq"
        elif "gemini" in self.providers:  # #2 Smart & Free
            selected_provider = "gemini"
        elif "deepseek" in self.providers:  # #3 NEW: Fast reasoning
            selected_provider = "deepseek"
        elif "xai" in self.providers:  # #4 NEW: Grok
            selected_provider = "xai"
        elif "mistral" in self.providers:  # #5 Good & Free
            selected_provider = "mistral"
        elif "cohere" in self.providers:  # #6 Good reasoning
            selected_provider = "cohere"
        elif "together" in self.providers:  # #7 Alternative
            selected_provider = "together"
        elif "huggingface" in self.providers:  # #8 Open source
            selected_provider = "huggingface"
        elif "openrouter" in self.providers:  # #9 Multi-model
            selected_provider = "openrouter"
        elif "openai" in self.providers:  # #10 Powerful but paid
            selected_provider = "openai"
        elif "ollama" in self.providers:  # #11 Local fallback
            selected_provider = "ollama"
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
            elif selected_provider in ["groq", "mistral", "openrouter", "together", "xai", "deepseek"]:
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

def get_llm_service() -> LLMService:
    """Повертає singleton LLM сервісу."""
    return llm_service
