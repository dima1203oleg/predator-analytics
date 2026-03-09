"""
Ollama + LiteLLM Configuration (Phase 5B — SM Edition).

$0 LLM budget: Ollama local → Groq Free → Gemini Free.
Implements §10 of the TZ.
"""
from datetime import datetime, timezone
from typing import Any


# LLM Cascade (§10.2): local → free tier → error
LLM_CASCADE: list[dict[str, Any]] = [
    {
        "tier": 1,
        "provider": "ollama",
        "model": "mistral:7b-instruct-v0.3-q4_K_M",
        "vram_gb": 4.0,
        "context_window": 8192,
        "cost": "$0",
        "latency": "local",
    },
    {
        "tier": 2,
        "provider": "groq",
        "model": "llama-3.3-70b-versatile",
        "cost": "$0 (free tier)",
        "rate_limit": "30 req/min",
        "latency": "~500ms",
    },
    {
        "tier": 3,
        "provider": "gemini",
        "model": "gemini-2.0-flash",
        "cost": "$0 (free tier)",
        "rate_limit": "15 req/min",
        "latency": "~700ms",
    },
]


class LiteLLMConfig:
    """LiteLLM multi-provider config (SM, $0 budget)."""

    def __init__(self) -> None:
        self.config: dict[str, Any] = {
            "budget_limit": "$0",
            "default_model": "ollama/mistral:7b-instruct-v0.3-q4_K_M",
            "fallback_order": ["ollama", "groq", "gemini"],
            "max_tokens": 4096,
            "temperature": 0.1,
            "timeout_seconds": 30,
            "retry_count": 2,
        }

    def get_config(self) -> dict[str, Any]:
        """Конфігурація LiteLLM."""
        return {
            **self.config,
            "cascade": LLM_CASCADE,
            "status": "active",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def get_model_info(self, provider: str = "ollama") -> dict[str, Any]:
        """Інформація про модель за провайдером."""
        for model in LLM_CASCADE:
            if model["provider"] == provider:
                return model
        return {"error": f"Provider '{provider}' not found"}

    def get_budget_status(self) -> dict[str, Any]:
        """Стан бюджету LLM ($0)."""
        return {
            "budget": "$0",
            "local_model": "mistral:7b-instruct-v0.3-q4_K_M",
            "free_tier_usage": {
                "groq": {"used": 0, "limit": 30, "unit": "req/min"},
                "gemini": {"used": 0, "limit": 15, "unit": "req/min"},
            },
        }
