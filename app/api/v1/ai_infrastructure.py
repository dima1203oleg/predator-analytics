"""AI/ML Infrastructure API (Phase 5 — SM Edition).

Endpoints for GPU management, Confidence Score, Decision Ledger.
"""
from typing import Any

from fastapi import APIRouter

from app.services.ai.confidence_score import ConfidenceScoreCalculator
from app.services.ai.decision_ledger import DecisionLedger
from app.services.ai.gpu_memory_manager import GPUMemoryManager

router = APIRouter(prefix="/ai", tags=["AI/ML Infrastructure"])

_gpu = GPUMemoryManager()
_confidence = ConfidenceScoreCalculator()
_ledger = DecisionLedger()


# --- GPU ---

@router.get("/gpu/status")
async def get_gpu_status() -> dict[str, Any]:
    """Стан GPU (GTX 1080)."""
    return _gpu.get_gpu_status()


@router.get("/gpu/degradation-policy")
async def get_degradation_policy() -> list[dict[str, Any]]:
    """Degradation policy для VRAM та RAM."""
    return _gpu.get_degradation_policy()


@router.get("/gpu/allocation/{service}")
async def check_gpu_allocation(service: str) -> dict[str, Any]:
    """Перевірити можливість виділення GPU для сервісу."""
    return _gpu.check_allocation(service)


# --- Confidence Score ---

@router.get("/confidence/config")
async def get_confidence_config() -> dict[str, Any]:
    """Конфігурація Confidence Score (§9.8)."""
    return _confidence.get_config()


@router.post("/confidence/calculate")
async def calculate_confidence(
    completeness: float = 0.8,
    stability: float = 0.7,
    accuracy: float = 0.9,
    variance: float = 0.6,
    drift: float = 0.5,
) -> dict[str, Any]:
    """Розрахувати Confidence Score для CERS рішення."""
    return _confidence.calculate(completeness, stability, accuracy, variance, drift)


# --- Decision Ledger ---

@router.get("/decisions/config")
async def get_decision_ledger_config() -> dict[str, Any]:
    """Конфігурація WORM Decision Ledger."""
    return _ledger.get_config()


@router.get("/decisions/stats")
async def get_decision_stats() -> dict[str, Any]:
    """Статистика Decision Ledger."""
    return _ledger.get_stats()
