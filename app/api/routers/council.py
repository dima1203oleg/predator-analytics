from __future__ import annotations


"""LLM Council API Router
Provides endpoints for multi-model consensus queries.
"""

from datetime import datetime
import logging
from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, BackgroundTasks, HTTPException
from prometheus_client import REGISTRY
from pydantic import BaseModel, Field

from app.core.db import async_session_maker
from app.models import CouncilSession
from app.services.llm_council.council_orchestrator import LLMCouncilOrchestrator, create_default_council


if TYPE_CHECKING:
    from app.services.llm_council import ConsensusResult


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/council", tags=["LLM Council"])


# Request/Response Models
class CouncilQueryRequest(BaseModel):
    """Request for council deliberation."""

    query: str = Field(..., description="Question or task for the council")
    context: str | None = Field(None, description="Background information")
    models: list[str] | None = Field(
        default=["gemini", "groq"], description="Models to include in council (defaults to free tier)"
    )
    enable_peer_review: bool = Field(default=True, description="Enable peer review phase (slower but higher quality)")
    chairman_model: str | None = Field(None, description="Model to use as chairman (default: gpt4)")


class CouncilQueryResponse(BaseModel):
    """Response from council deliberation."""

    request_id: str
    final_answer: str
    confidence: float
    contributing_models: list[str]
    peer_review_summary: dict[str, Any]
    dissenting_opinions: list[dict[str, str]]
    individual_responses: list[dict[str, Any]] = []  # New: Full debate history
    metadata: dict[str, Any]
    timestamp: datetime


class CouncilStatsResponse(BaseModel):
    """Statistics about council performance."""

    total_deliberations: int
    average_confidence: float
    average_deliberation_time: float
    member_participation: dict[str, int]


# Global council instance (will be initialized on first use)
_council_instance: LLMCouncilOrchestrator | None = None


def get_council() -> LLMCouncilOrchestrator:
    """Get or create council instance."""
    global _council_instance

    if _council_instance is None:
        try:
            _council_instance = create_default_council()
            logger.info(f"Initialized council with {len(_council_instance.members)} members")
        except Exception as e:
            logger.exception(f"Failed to initialize council: {e}")
            raise HTTPException(status_code=503, detail=f"LLM Council unavailable: {e!s}")

    return _council_instance


@router.post("/query", response_model=CouncilQueryResponse)
async def query_council(request: CouncilQueryRequest, background_tasks: BackgroundTasks):
    """Query the LLM Council for a consensus answer.

    The council will:
    1. Generate independent responses from multiple models
    2. Conduct peer review (if enabled)
    3. Synthesize a consensus answer

    This typically takes 10-30 seconds depending on models and peer review.
    """
    try:
        import time

        start_time = time.time()

        # If specific models requested, create a dynamic council, else use global
        council = create_default_council(include_models=request.models) if request.models else get_council()

        # Deliberate
        result: ConsensusResult = await council.deliberate(
            query=request.query, context=request.context, enable_peer_review=request.enable_peer_review
        )

        # Track metrics (Prometheus)
        try:
            from app.api.routers.metrics import metrics_helper

            elapsed = time.time() - start_time
            metrics_helper.track_llm_council(
                num_models=len(result.contributing_models),
                latency=elapsed,
                confidence=result.confidence,
                num_peer_reviews=len(result.peer_reviews),
                peer_review_enabled=request.enable_peer_review,
            )
        except Exception as me:
            logger.warning(f"Failed to track metrics: {me}")

        # Format peer review summary
        peer_review_summary = _format_peer_review_summary(result.peer_reviews)

        # Generate request ID
        request_id = f"council_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"

        background_tasks.add_task(_log_to_mlflow, request_id=request_id, query=request.query, result=result)

        # Save to DB
        background_tasks.add_task(
            _save_council_session, request_id=request_id, query=request.query, context=request.context, result=result
        )

        return CouncilQueryResponse(
            request_id=request_id,
            final_answer=result.final_answer,
            confidence=result.confidence,
            contributing_models=result.contributing_models,
            peer_review_summary=peer_review_summary,
            dissenting_opinions=result.dissenting_opinions,
            individual_responses=result.individual_responses,
            metadata=result.metadata,
            timestamp=datetime.now(),
        )

    except Exception as e:
        logger.exception(f"Council query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Council deliberation failed: {e!s}")


@router.post("/strategy", response_model=CouncilQueryResponse)
async def council_strategy_session(background_tasks: BackgroundTasks):
    """Initiate a dedicated Strategic Governance Session.
    The council will analyze system health, resources, and knowledge density
    to provide a roadmap for the next 24 hours.
    """
    try:
        # specialized query for strategic analysis
        query = """
        Conduct a comprehensive Strategic Analysis of the Predator Analytics platform.
        Evaluate:
        1. Infrastructure Stability (Ops Sentinel data)
        2. Knowledge Matrix density and quality
        3. Risk factors (including Lockdowns)
        4. Resource optimization opportunities

        Provide a prioritized list of actions for the Autonomous Orchestrator.
        """

        # Collect system stats for context
        try:
            opensearch_docs = REGISTRY.get_sample_value("opensearch_docs_total") or 0
            qdrant_vectors = REGISTRY.get_sample_value("qdrant_vectors_total") or 0
            # Try to get sum of all processed documents
            # Note: get_sample_value requires exact labels usually, or we iterate.
            # For simplicity, we grab the gauges if available.

            context_stats = f"SYSTEM TELEMETRY (REAL-TIME):\n- Knowledge Base: {int(opensearch_docs)} docs, {int(qdrant_vectors)} vectors."
        except Exception as me:
            logger.warning(f"Could not fetch metrics for strategy: {me}")
            context_stats = "SYSTEM TELEMETRY: Unknown"

        council = get_council()
        result = await council.deliberate(
            query=query,
            context=f"GOVERNANCE_MODE: High-level strategic planning session.\n{context_stats}",
            enable_peer_review=True,
        )

        request_id = f"strategy_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Save to DB
        background_tasks.add_task(
            _save_council_session, request_id=request_id, query=query, context=context_stats, result=result
        )

        return CouncilQueryResponse(
            request_id=request_id,
            final_answer=result.final_answer,
            confidence=result.confidence,
            contributing_models=result.contributing_models,
            peer_review_summary=_format_peer_review_summary(result.peer_reviews),
            dissenting_opinions=result.dissenting_opinions,
            individual_responses=result.individual_responses,
            metadata=result.metadata,
            timestamp=datetime.now(),
        )
    except Exception as e:
        logger.exception(f"Strategy session failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_council_history(limit: int = 10):
    """Get recent council sessions from DB."""
    try:
        from sqlalchemy import desc, select

        from app.models import CouncilSession

        async with async_session_maker() as session:
            result = await session.execute(
                select(CouncilSession).order_by(desc(CouncilSession.created_at)).limit(limit)
            )
            return result.scalars().all()
    except Exception as e:
        logger.exception(f"Failed to fetch history: {e}")
        return []


@router.get("/stats", response_model=CouncilStatsResponse)
async def get_council_stats():
    """Get statistics about council performance."""
    try:
        council = get_council()
        stats = council.get_deliberation_stats()

        return CouncilStatsResponse(**stats)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {e!s}")


@router.post("/reset")
async def reset_council():
    """Reset council instance (clears history)
    Useful for testing or when changing configuration.
    """
    global _council_instance
    _council_instance = None

    return {"status": "Council reset successfully"}


@router.get("/health")
async def council_health():
    """Check if council is operational."""
    try:
        council = get_council()

        return {
            "status": "healthy",
            "members": [m.model_id for m in council.members],
            "chairman": council.chairman.model_id,
            "total_deliberations": len(council.deliberation_history),
        }

    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# Helper Functions
async def _log_to_mlflow(request_id: str, query: str, result: ConsensusResult):
    """Log council deliberation to MLflow."""
    try:
        import mlflow

        with mlflow.start_run(run_name=f"council_{request_id}"):
            # Log parameters
            mlflow.log_param("query", query[:200])
            mlflow.log_param("num_models", len(result.contributing_models))
            mlflow.log_param("chairman", result.chairman_reasoning)

            # Log metrics
            mlflow.log_metric("confidence", result.confidence)
            mlflow.log_metric("num_peer_reviews", len(result.peer_reviews))
            mlflow.log_metric("deliberation_time", result.metadata.get("deliberation_time_seconds", 0))

            # Log artifacts
            mlflow.log_text(result.final_answer, "final_answer.txt")

            if result.dissenting_opinions:
                mlflow.log_dict({"dissenting": result.dissenting_opinions}, "dissenting_opinions.json")

            logger.info(f"Logged council deliberation to MLflow: {request_id}")

    except Exception as e:
        logger.warning(f"Failed to log to MLflow: {e}")


async def _save_council_session(request_id: str, query: str, context: str | None, result: ConsensusResult):
    """Save council session to PostgreSQL."""
    try:
        async with async_session_maker() as session:
            db_session = CouncilSession(
                id=request_id,
                query=query,
                context=context,
                final_answer=result.final_answer,
                confidence=result.confidence,
                participants=result.contributing_models,
                dissenting_opinions=result.dissenting_opinions,
                peer_reviews=[r.dict() for r in result.peer_reviews],
                meta_info=result.metadata,
            )
            session.add(db_session)
            await session.commit()
            logger.info(f"✅ Saved council session {request_id} to DB")
    except Exception as e:
        logger.exception(f"❌ Failed to save council session to DB: {e}")


def _format_peer_review_summary(peer_reviews: list[Any]) -> dict[str, Any]:
    """Helper to format peer review summary for responses."""
    if not peer_reviews:
        return {"total_reviews": 0, "by_model": {}, "average_scores": {}}

    # Group reviews by reviewed model
    by_model = {}
    for review in peer_reviews:
        model = review.reviewed_response_id
        if model not in by_model:
            by_model[model] = []
        by_model[model].append({
            "reviewer": review.reviewer_id,
            "score": review.score,
            "critique": review.critique[:100] + "..." if len(review.critique) > 100 else review.critique,
        })

    return {
        "total_reviews": len(peer_reviews),
        "by_model": by_model,
        "average_scores": {
            model: sum(r["score"] for r in reviews) / len(reviews) for model, reviews in by_model.items()
        },
    }


# Example usage in docs
@router.get("/example")
async def get_example_usage():
    """Get example of how to use the council API."""
    return {
        "description": "LLM Council API - Multi-model consensus system",
        "example_request": {
            "url": "/api/council/query",
            "method": "POST",
            "body": {
                "query": "Проаналізуй аномалії в митних деклараціях за 2024 рік",
                "context": "Датасет містить 10,000 декларацій з різними товарами",
                "models": ["gpt4", "claude", "gpt3.5"],
                "enable_peer_review": True,
            },
        },
        "workflow": [
            "1. Independent Generation: Each model answers independently",
            "2. Peer Review: Models critique each other's responses",
            "3. Consensus: Chairman synthesizes best answer",
            "4. Return: High-quality consensus with confidence score",
        ],
        "benefits": [
            "Higher accuracy than single model",
            "Reduced hallucinations through peer review",
            "Diversity of perspectives",
            "Confidence scoring based on agreement",
        ],
    }
