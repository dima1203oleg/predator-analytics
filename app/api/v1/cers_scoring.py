"""
CERS Calculator API (Phase 5B — SM Edition).

Endpoints for CERS 5-layer scoring and LLM configuration.
"""
from fastapi import APIRouter
from typing import Any

from app.services.ai.cers_calculator import CERSCalculator
from app.services.ai.litellm_config import LiteLLMConfig

router = APIRouter(prefix="/cers", tags=["CERS Meta-Scoring"])

_cers = CERSCalculator()
_llm = LiteLLMConfig()


@router.get("/config")
async def get_cers_config() -> dict[str, Any]:
    """Конфігурація CERS калькулятора (§9)."""
    return _cers.get_config()


@router.post("/calculate")
async def calculate_cers(
    behavioral: float = 50.0,
    institutional: float = 50.0,
    influence: float = 50.0,
    structural: float = 50.0,
    predictive: float = 50.0,
) -> dict[str, Any]:
    """Розрахувати CERS для компанії (5-layer meta-scoring)."""
    return _cers.calculate(behavioral, institutional, influence, structural, predictive)


# --- LLM ---

@router.get("/llm/config")
async def get_llm_config() -> dict[str, Any]:
    """Конфігурація Ollama + LiteLLM ($0 budget)."""
    return _llm.get_config()


@router.get("/llm/model/{provider}")
async def get_model_info(provider: str) -> dict[str, Any]:
    """Інформація про LLM за провайдером."""
    return _llm.get_model_info(provider)


@router.get("/llm/budget")
async def get_budget_status() -> dict[str, Any]:
    """Стан LLM бюджету ($0)."""
    return _llm.get_budget_status()
