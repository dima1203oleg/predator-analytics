"""
PREDATOR Factory API Router
Endpoints для інгестії та звітів
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional
import uuid
import logging

from app.models.factory import (
    PipelineResult,
    Pattern,
    Report,
    FactoryStats,
)
from app.services.factory_scorer import (
    calculate_score,
    should_create_pattern,
    is_gold_pattern,
    classify_pattern_type,
)
from app.services.factory_repository import FactoryRepository
from app.dependencies import get_redis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/factory", tags=["factory"])


def get_factory_repo(request: Request) -> FactoryRepository:
    """DI для репозиторію"""
    return request.app.state.factory_repo


@router.post("/ingest", response_model=dict)
async def ingest_pipeline_result(
    request: Request,
    result: PipelineResult,
    repo: FactoryRepository = Depends(get_factory_repo),
    redis_client=Depends(get_redis),
):
    """
    Приймає результат CI/CD пайплайну.
    
    Повертає 202 з ID патерну, якщо score >= 85.
    
    Example:
        POST /api/v1/factory/ingest
        {
            "run_id": "github-123",
            "component": "backend",
            "metrics": {
                "coverage": 95,
                "pass_rate": 98,
                "performance": 92,
                "chaos_resilience": 88,
                "business_kpi": 85
            },
            "changes": {"modified": ["src/main.py"]},
            "branch": "main",
            "commit_sha": "abc123"
        }
    """
    correlation_id = str(uuid.uuid4())
    logger.info(
        f"Factory ingest started",
        extra={"correlation_id": correlation_id, "run_id": result.run_id},
    )

    try:
        # Розраховуємо score
        score = calculate_score(result.metrics)
        logger.info(
            f"Score calculated: {score}",
            extra={"correlation_id": correlation_id},
        )

        # Зберігаємо Run для аудиту
        await repo.save_run(result)

        # Якщо score низький — просто повертаємо
        if not should_create_pattern(score):
            logger.info(
                f"Score below threshold ({score} < 85)",
                extra={"correlation_id": correlation_id},
            )
            return {
                "status": "ignored",
                "reason": "score_below_threshold",
                "score": score,
                "correlation_id": correlation_id,
            }

        # Перевіряємо дублікати в Redis (кеш на 1 годину)
        pattern_hash = result.compute_hash()
        cache_key = f"factory:pattern:{pattern_hash}"
        cached = await redis_client.get(cache_key)
        if cached:
            logger.info(
                f"Pattern already exists (cached)",
                extra={"correlation_id": correlation_id},
            )
            return {
                "status": "duplicate",
                "reason": "pattern_exists",
                "hash": pattern_hash,
                "correlation_id": correlation_id,
            }

        # Створюємо патерн
        pattern = Pattern(
            component=result.component,
            pattern_description=f"Успішне виконання на {result.component.value} "
            f"з score {score}: {', '.join(result.changes.keys())}",
            pattern_type=classify_pattern_type(result.metrics),
            score=score,
            gold=is_gold_pattern(score),
            hash=pattern_hash,
            tags=["auto-generated"],
            source_run_id=result.run_id,
            metrics_snapshot=result.metrics,
        )

        # Зберігаємо в Neo4j
        pattern_id = await repo.save_pattern(pattern)

        # Кешуємо (1 година)
        await redis_client.setex(cache_key, 3600, pattern_id or "exists")

        logger.info(
            f"Pattern created and cached",
            extra={
                "correlation_id": correlation_id,
                "pattern_id": pattern_id,
                "gold": pattern.gold,
            },
        )

        return {
            "status": "created",
            "pattern_id": pattern_id,
            "hash": pattern_hash,
            "score": score,
            "gold": pattern.gold,
            "correlation_id": correlation_id,
        }

    except Exception as e:
        logger.error(
            f"Factory ingest error: {str(e)}",
            extra={"correlation_id": correlation_id},
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Factory ingest failed",
                "correlation_id": correlation_id,
                "error": str(e),
            },
        )


@router.get("/patterns/gold", response_model=List[Pattern])
async def get_gold_patterns(
    component: Optional[str] = None,
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Отримати Gold Patterns"""
    try:
        patterns = await repo.get_gold_patterns(component)
        return patterns
    except Exception as e:
        logger.error(f"Error fetching gold patterns: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch patterns")


@router.get("/stats", response_model=FactoryStats)
async def get_factory_stats(
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Отримати статистику Factory"""
    try:
        stats = await repo.get_stats()
        return stats
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch stats")


@router.get("/health")
async def factory_health():
    """Health check Factory Core"""
    return {"status": "healthy", "service": "factory_core"}
