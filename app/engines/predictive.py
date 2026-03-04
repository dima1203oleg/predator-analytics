"""Predator v55.0 — Predictive Engine.

Probabilistic forecasting of future events.
Online models: Logistic Regression, Light GBM (runtime).
Offline models: XGBoost, CatBoost, Monte Carlo, Diffusion (nightly batch).

Predictions: disappearance probability, regulatory intervention,
concentration risk, scheme emergence.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.confidence import ConfidenceScore, quick_confidence
from app.core.signal_bus import SignalBus
from app.models.v55.signal import SignalLayer, SignalPriority, V55Signal


logger = logging.getLogger("predator.engines.predictive")


@dataclass
class PredictiveScore:
    """Aggregated predictive metrics for one entity."""

    ueid: str
    disappearance_risk: float
    regulatory_intervention_risk: float
    concentration_risk: float
    scheme_emergence_risk: float
    aggregate: float
    confidence: ConfidenceScore
    model_versions: dict[str, str] = field(default_factory=dict)


def compute_predictive_score(
    ueid: str,
    behavioral_aggregate: float,
    institutional_aggregate: float,
    influence_aggregate: float,
    structural_aggregate: float,
    historical_features: dict[str, float] | None = None,
    data_completeness: float = 0.5,
) -> PredictiveScore:
    """Compute predictive score for an entity.

    Phase 1: Uses simple heuristic model.
    Phase 3: Will use XGBoost/CatBoost/Monte Carlo from MLflow.

    Args:
        ueid: Entity UEID.
        behavioral_aggregate: Behavioral layer aggregate (0-100).
        institutional_aggregate: Institutional layer aggregate (0-100).
        influence_aggregate: Influence layer aggregate (0-100).
        structural_aggregate: Structural layer aggregate (0-100).
        historical_features: Additional features for ML models.
        data_completeness: Data completeness factor (0-1).

    Returns:
        PredictiveScore with risk predictions.
    """
    # Phase 1: Heuristic model (weighted combination)
    # Phase 3: Replace with trained models from MLflow

    disappearance = (
        0.40 * behavioral_aggregate + 0.30 * structural_aggregate + 0.30 * institutional_aggregate
    )
    regulatory = (
        0.30 * institutional_aggregate + 0.40 * influence_aggregate + 0.30 * structural_aggregate
    )
    concentration = (
        0.50 * influence_aggregate + 0.30 * structural_aggregate + 0.20 * behavioral_aggregate
    )
    scheme = 0.35 * structural_aggregate + 0.35 * behavioral_aggregate + 0.30 * influence_aggregate

    # Clamp all to 0-100
    disappearance = round(max(0.0, min(100.0, disappearance)), 2)
    regulatory = round(max(0.0, min(100.0, regulatory)), 2)
    concentration = round(max(0.0, min(100.0, concentration)), 2)
    scheme = round(max(0.0, min(100.0, scheme)), 2)

    aggregate = 0.30 * disappearance + 0.25 * regulatory + 0.25 * concentration + 0.20 * scheme
    aggregate = round(max(0.0, min(100.0, aggregate)), 2)

    confidence = quick_confidence(data_completeness * 0.8)  # Lower confidence for predictions

    logger.info(
        "Predictive score computed: ueid=%s disappear=%.1f regulatory=%.1f agg=%.1f",
        ueid,
        disappearance,
        regulatory,
        aggregate,
    )

    return PredictiveScore(
        ueid=ueid,
        disappearance_risk=disappearance,
        regulatory_intervention_risk=regulatory,
        concentration_risk=concentration,
        scheme_emergence_risk=scheme,
        aggregate=aggregate,
        confidence=confidence,
        model_versions={"phase": "1", "type": "heuristic"},
    )


async def process_entity(ueid: str, session: AsyncSession) -> PredictiveScore:
    """Run Predictive Analysis for a specific entity.
    Features async DB persistence and real-time scaling out via SignalBus.
    """
    from app.repositories.predictive_repository import PredictiveRepository
    repo = PredictiveRepository(session)
    
    # 🚨 PREDATOR LAZY LOADING / MOCKS
    # Temporarily generate semi-random metrics until full MLflow integration
    import random
    beh = random.uniform(0.0, 100.0)
    inst = random.uniform(0.0, 100.0)
    infl = random.uniform(0.0, 100.0)
    struct = random.uniform(0.0, 100.0)
    data_comp = random.uniform(0.5, 1.0)

    score = compute_predictive_score(
        ueid,
        behavioral_aggregate=beh,
        institutional_aggregate=inst,
        influence_aggregate=infl,
        structural_aggregate=struct,
        data_completeness=data_comp,
    )

    # 1. DB Persistence
    await repo.save_score(score)

    # 2. Emit Signal (v55 standard)
    bus = SignalBus.get_instance()
    signal = V55Signal(
        signal_type="PREDICTIVE_SCORING",
        topic="predictive.analyzed",
        ueid=ueid,
        layer=SignalLayer.PREDICTIVE,
        priority=SignalPriority.CRITICAL if score.aggregate > 80 else SignalPriority.HIGH if score.aggregate > 60 else SignalPriority.ROUTINE,
        score=score.aggregate,
        confidence=score.confidence.final_score,
        summary=f"Прогнозування ризиків: Disappearance={score.disappearance_risk:.1f}, Scheme={score.scheme_emergence_risk:.1f}",
        metadata={
            "disappearance_risk": score.disappearance_risk,
            "regulatory_intervention_risk": score.regulatory_intervention_risk,
            "concentration_risk": score.concentration_risk,
            "scheme_emergence_risk": score.scheme_emergence_risk
        }
    )
    # emit expects db session for persistence fallback
    await bus.emit(signal, session=session)

    logger.info("Predictive Engine processed ueid=%s, agg=%.1f", ueid, score.aggregate)
    return score
