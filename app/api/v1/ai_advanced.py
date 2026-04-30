"""Advanced AI/ML API (Phase 11 — SM Edition).

Endpoints for Topic Modeling (BERTopic), Nightly Batch triggers,
and Monte Carlo Simulations.
"""
from typing import Any

from fastapi import APIRouter

from app.services.ai import MonteCarloSimulator, NightlyBatchPredictor, TopicModels

router = APIRouter(prefix="/ai-advanced-v2", tags=["Advanced AI/ML (Topic, Batch, MonteCarlo)"])

_topics = TopicModels()
_batch = NightlyBatchPredictor()
_monte_carlo = MonteCarloSimulator()


@router.post("/topics/detect-trends")
async def detect_topic_trends(text_corpus: list[str]) -> dict[str, Any]:
    """Виявлення трендів та темпу змін (Topic Velocity)."""
    return _topics.detect_trends(text_corpus)


@router.post("/batch/trigger")
async def trigger_nightly_batch(entity_type: str = "companies") -> dict[str, Any]:
    """Ручний запуск Nightly ML Batch (XGBoost / CatBoost)."""
    return _batch.run_prediction_batch(entity_type)


@router.post("/simulation/monte-carlo")
async def run_monte_carlo(base_asset_value: float, iterations: int = 1000) -> dict[str, Any]:
    """Симуляція Монте-Карло для оцінки ризику портфеля."""
    return _monte_carlo.simulate_risk(base_asset_value, iterations)
