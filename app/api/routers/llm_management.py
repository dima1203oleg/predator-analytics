from __future__ import annotations


"""LLM Keys Management API
Управління API ключами для LLM провайдерів.
"""
from datetime import UTC, datetime, timezone
import logging
from pathlib import Path

# Import storage after initialization
import sys
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ...services.llm import llm_service


sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.llm_keys_storage import llm_keys_storage


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/llm", tags=["LLM Management"])


# ============================================
# Models
# ============================================

class LLMProviderConfig(BaseModel):
    """Конфігурація провайдера."""
    id: str = Field(..., description="Provider ID (groq, gemini, etc)")
    name: str = Field(..., description="Provider name")
    model: str = Field(..., description="Default model")
    base_url: str = Field(..., description="API base URL")
    api_keys: list[str] = Field(default_factory=list, description="API keys")
    enabled: bool = Field(default=True, description="Is provider enabled")
    free: bool = Field(default=True, description="Is provider free")
    description: str | None = None


class AddKeyRequest(BaseModel):
    """Запит на додавання ключа."""
    provider_id: str = Field(..., description="Provider ID")
    api_key: str = Field(..., description="API key")
    test: bool = Field(default=True, description="Test key before adding")


class TestKeyRequest(BaseModel):
    """Запит на тестування ключа."""
    provider_id: str
    api_key: str
    model: str | None = None


class UpdateProviderRequest(BaseModel):
    """Оновлення провайдера."""
    enabled: bool | None = None
    model: str | None = None


# ============================================
# Endpoints
# ============================================

@router.get("/providers", response_model=list[LLMProviderConfig])
async def get_providers():
    """Отримати список всіх LLM провайдерів."""
    providers = []

    # Get from llm_service
    for provider_id, config in llm_service.providers.items():
        providers.append(LLMProviderConfig(
            id=provider_id,
            name=provider_id.title(),
            model=config.get("model", ""),
            base_url=config.get("base_url", ""),
            api_keys=["***" + k[-4:] for k in config.get("api_keys", [config.get("api_key")])  if k],
            enabled=True,
            free=provider_id not in ["openai", "anthropic"],
            description=get_provider_description(provider_id)
        ))

    # Add available but not configured
    available = ["groq", "gemini", "openai", "anthropic", "mistral", "cohere",
                 "together", "xai", "deepseek", "huggingface", "openrouter", "ollama"]

    for prov in available:
        if prov not in llm_service.providers:
            providers.append(LLMProviderConfig(
                id=prov,
                name=prov.title(),
                model=get_default_model(prov),
                base_url=get_default_base_url(prov),
                api_keys=[],
                enabled=False,
                free=prov not in ["openai", "anthropic"],
                description=get_provider_description(prov)
            ))

    return providers


@router.post("/providers/{provider_id}/keys")
async def add_api_key(provider_id: str, request: AddKeyRequest):
    """Додати API ключ для провайдера."""
    # Validate provider
    if request.provider_id != provider_id:
        raise HTTPException(400, "Provider ID mismatch")

    # Test key if requested
    if request.test:
        test_result = await test_api_key(
            provider_id=provider_id,
            api_key=request.api_key
        )

        if not test_result["success"]:
            raise HTTPException(400, f"Key test failed: {test_result['error']}")

    # Save to storage
    try:
        await llm_keys_storage.add_llm_key(provider_id, request.api_key)

        # Reload llm_service
        llm_service._init_providers()

        return {
            "success": True,
            "message": f"API key added for {provider_id}",
            "total_keys": len(llm_service.providers.get(provider_id, {}).get("api_keys", []))
        }
    except Exception as e:
        logger.exception(f"Failed to add key: {e}")
        raise HTTPException(500, str(e))


@router.delete("/providers/{provider_id}/keys/{key_index}")
async def remove_api_key(provider_id: str, key_index: int):
    """Видалити API ключ."""
    try:
        await llm_keys_storage.remove_llm_key(provider_id, key_index)
        llm_service._init_providers()

        return {"success": True, "message": f"Key {key_index} removed"}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/providers/{provider_id}/test")
async def test_provider(provider_id: str, request: TestKeyRequest):
    """Тестувати API ключ провайдера."""
    return await test_api_key(
        provider_id=request.provider_id,
        api_key=request.api_key,
        model=request.model
    )



@router.put("/providers/{provider_id}")
async def update_provider(provider_id: str, request: UpdateProviderRequest):
    """Оновити налаштування провайдера."""
    try:
        await llm_keys_storage.update_provider_settings(
            provider_id,
            enabled=request.enabled,
            model=request.model
        )

        llm_service._init_providers()

        return {"success": True, "message": "Provider updated"}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/stats")
async def get_llm_stats():
    """Статистика використання LLM."""
    return {
        "total_providers": len(llm_service.providers),
        "active_providers": sum(1 for p in llm_service.providers.values() if p),
        "total_keys": sum(
            len(p.get("api_keys", [p.get("api_key")]))
            for p in llm_service.providers.values()
        ),
        "providers": llm_service.get_available_providers()
    }


@router.get("/status")
async def get_llm_full_status():
    """Повний статус всіх LLM провайдерів для frontend LLMHealthMonitor."""
    import asyncio
    import time

    providers_status = []
    fallback_chain = []
    total_cost = 0.0
    total_tokens = 0

    # Get list of all providers
    all_providers = ["groq", "gemini", "mistral", "ollama", "openrouter", "together", "deepseek", "xai"]

    async def check_provider(provider_id: str) -> dict:
        """Check single provider status."""
        config = llm_service.providers.get(provider_id, {})
        has_keys = bool(config.get("api_keys") or config.get("api_key"))

        status = "unknown"
        latency = 0

        # Get real usage stats
        usage = llm_service.get_usage_stats()["providers"].get(provider_id, {})

        if has_keys:
            try:
                start = time.time()
                response = await asyncio.wait_for(
                    llm_service.generate(
                        prompt="test",
                        provider=provider_id,
                        max_tokens=1
                    ),
                    timeout=10.0
                )
                latency = int((time.time() - start) * 1000)

                status = "online" if response.success else "degraded" if latency < 5000 else "offline"
            except TimeoutError:
                status = "offline"
                latency = 10000
            except Exception:
                status = "offline"
                latency = 0
        else:
            status = "offline"

        return {
            "id": provider_id,
            "name": get_provider_description(provider_id).split(" - ")[0] if " - " in get_provider_description(provider_id) else provider_id.title(),
            "status": status,
            "latency": latency or usage.get("latency_total", 0) / max(1, usage.get("count", 1)),
            "uptime": 99.9 if status == "online" else 95.0 if status == "degraded" else 0.0,
            "tokensUsed": usage.get("tokens", 0),
            "tokensLimit": 500000,
            "costToday": round(usage.get("cost", 0.0), 4),
            "isPrimary": provider_id == "groq",
            "lastCheck": datetime.now(UTC).isoformat(),
            "model": config.get("model", get_default_model(provider_id))
        }

    # Check all providers in parallel
    tasks = [check_provider(p) for p in all_providers]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for i, result in enumerate(results):
        if isinstance(result, dict):
            providers_status.append(result)
            if result["status"] != "offline":
                total_tokens += result["tokensUsed"]
                total_cost += result["costToday"]
        else:
            providers_status.append({
                "id": all_providers[i],
                "name": all_providers[i].title(),
                "status": "unknown",
                "latency": 0,
                "uptime": 0,
                "tokensUsed": 0,
                "tokensLimit": 0,
                "costToday": 0,
                "isPrimary": False,
                "lastCheck": datetime.now(UTC).isoformat(),
                "model": ""
            })

    # Build fallback chain
    chain_order = ["Groq", "Gemini", "Mistral", "OpenRouter", "Together", "Ollama"]
    for i, name in enumerate(chain_order):
        provider = next((p for p in providers_status if p["name"].lower().startswith(name.lower())), None)
        fallback_chain.append({
            "provider": name,
            "order": i + 1,
            "status": "active" if i == 0 and provider and provider["status"] == "online"
                      else "failed" if provider and provider["status"] == "offline"
                      else "standby"
        })

    return {
        "providers": providers_status,
        "fallbackChain": fallback_chain,
        "totalCost": total_cost,
        "totalTokens": total_tokens
    }


# ============================================
# Helper Functions
# ============================================

async def test_api_key(provider_id: str, api_key: str, model: str | None = None) -> dict[str, Any]:
    """Тестувати API ключ."""
    try:
        # Temporarily add key
        original_config = llm_service.providers.get(provider_id, {}).copy()

        # Create test config
        test_config = {
            "base_url": get_default_base_url(provider_id),
            "model": model or get_default_model(provider_id),
            "api_keys": [api_key]
        }

        llm_service.providers[provider_id] = test_config

        # Test with simple prompt
        response = await llm_service.generate(
            prompt="Say 'test successful' and nothing else",
            provider=provider_id,
            max_tokens=10
        )

        # Restore original
        if original_config:
            llm_service.providers[provider_id] = original_config
        else:
            del llm_service.providers[provider_id]

        if response.success:
            return {
                "success": True,
                "message": "Key is valid",
                "latency_ms": response.latency_ms,
                "model": response.model
            }
        return {
            "success": False,
            "error": response.error or "Unknown error"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def get_provider_description(provider_id: str) -> str:
    """Опис провайдера."""
    descriptions = {
        "groq": "⚡ Найшвидший безплатний LLM (Llama 3 70B)",
        "gemini": "🧠 Google Gemini 1.5 Pro - розумний і креативний",
        "deepseek": "🚀 Deepseek - швидкий reasoning китайської моделі",
        "xai": "🎯 Grok від Elon Musk - real-time data",
        "mistral": "⚖️ Mistral Large - збалансована модель",
        "cohere": "💡 Cohere Command R+ - сильне reasoning",
        "together": "🤝 Together.ai - open source моделі",
        "huggingface": "🤗 HuggingFace - open source інференс",
        "openrouter": "🔀 OpenRouter - доступ до багатьох моделей",
        "openai": "💰 OpenAI GPT-4 - найпотужніший (платний)",
        "anthropic": "🎨 Claude - креативний асистент (платний)",
        "ollama": "🏠 Ollama - локальні моделі"
    }
    return descriptions.get(provider_id, "LLM провайдер")


def get_default_model(provider_id: str) -> str:
    """Модель за замовчуванням."""
    models = {
        "groq": "llama3-70b-8192",
        "gemini": "gemini-1.5-pro",
        "openai": "gpt-4-turbo-preview",
        "anthropic": "claude-3-sonnet-20240229",
        "mistral": "mistral-large-latest",
        "cohere": "command-r-plus",
        "together": "meta-llama/Llama-3-70b-chat-hf",
        "xai": "grok-beta",
        "deepseek": "deepseek-chat",
        "huggingface": "mistralai/Mixtral-8x7B-Instruct-v0.1",
        "openrouter": "anthropic/claude-3-opus",
        "ollama": "llama3"
    }
    return models.get(provider_id, "")


def get_default_base_url(provider_id: str) -> str:
    """Base URL за замовчуванням."""
    urls = {
        "groq": "https://api.groq.com/openai/v1",
        "gemini": "https://generativelanguage.googleapis.com/v1beta",
        "openai": "https://api.openai.com/v1",
        "anthropic": "https://api.anthropic.com/v1",
        "mistral": "https://api.mistral.ai/v1",
        "cohere": "https://api.cohere.ai/v1",
        "together": "https://api.together.xyz/v1",
        "xai": "https://api.x.ai/v1",
        "deepseek": "https://api.deepseek.com/v1",
        "huggingface": "https://api-inference.huggingface.co/models",
        "openrouter": "https://openrouter.ai/api/v1",
        "ollama": "http://46.219.108.236:11434/api"
    }
    return urls.get(provider_id, "")
