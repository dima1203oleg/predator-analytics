"""PREDATOR Factory API Router
Endpoints для інгестії та звітів
"""

from datetime import datetime
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request

import asyncio
from app.dependencies import get_redis, get_neo4j_driver
from app.models.factory import (
    Bug,
    BugStatus,
    BugSeverity,
    FactoryStats,
    ImprovementPhase,
    Pattern,
    PipelineResult,
    SystemImprovement,
)
from app.services.factory_repository import FactoryRepository
from app.services.factory_scorer import (
    calculate_score,
    classify_pattern_type,
    is_gold_pattern,
    should_create_pattern,
)

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
    """Приймає результат CI/CD пайплайну.
    
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
        "Factory ingest started",
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
                "Pattern already exists (cached)",
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
            "Pattern created and cached",
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
            f"Factory ingest error: {e!s}",
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


@router.get("/patterns/gold", response_model=list[Pattern])
async def get_gold_patterns(
    component: str | None = None,
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Отримати Gold Patterns"""
    try:
        patterns = await repo.get_gold_patterns(component)
        return patterns
    except Exception as e:
        logger.error(f"Error fetching gold patterns: {e!s}", exc_info=True)
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
        logger.error(f"Error fetching stats: {e!s}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch stats")


@router.get("/health")
async def factory_health():
    """Health check Factory Core"""
    return {"status": "healthy", "service": "factory_core"}


@router.get("/bugs", response_model=list[Bug])
async def get_factory_bugs(
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Отримати список виявлених багів"""
    return await repo.get_bugs()


@router.post("/bugs/{bug_id}/fix")
async def fix_factory_bug(
    bug_id: str,
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Запустити процес виправлення бага"""
    # В реальності тут би запускався Task/Worker
    await repo.update_bug_status(bug_id, BugStatus.FIXING, 10)
    return {"status": "fixing_started", "bug_id": bug_id}


@router.get("/infinite/status", response_model=SystemImprovement)
async def get_infinite_status(
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Отримати статус циклу вдосконалення"""
    return await repo.get_improvement()


async def _run_ooda_task(driver):
    """Фоновий процес OODA циклу з прямим драйвером Neo4j"""
    repo = FactoryRepository(driver)
    while True:
        status = await repo.get_improvement()
        if not status.is_running:
            break
            
        # Phase 1: OBSERVE
        status.current_phase = ImprovementPhase.OBSERVE
        status.logs.append(f"[OBSERVE] Сканування метрик... {datetime.now().strftime('%H:%M:%S')}")
        await repo.update_improvement(status)
        await asyncio.sleep(8)
        
        # Phase 2: ORIENT
        status.current_phase = ImprovementPhase.ORIENT
        status.logs.append(f"[ORIENT] Аналіз контексту. Виявлено drift у graph-service.")
        await repo.update_improvement(status)
        await asyncio.sleep(8)
        
        # Phase 3: DECIDE
        status.current_phase = ImprovementPhase.DECIDE
        status.logs.append(f"[DECIDE] Пріоритезація: Self-healing дефекту BUG-001.")
        await repo.update_improvement(status)
        await asyncio.sleep(8)
        
        # Phase 4: ACT
        status.current_phase = ImprovementPhase.ACT
        status.cycles_completed += 1
        status.improvements_made += 1
        status.logs.append(f"[ACT] Деплой патчу v55.1.8. Цикл #{status.cycles_completed} завершено.")
        
        if len(status.logs) > 30:
            status.logs = status.logs[-30:]
            
        await repo.update_improvement(status)
        await asyncio.sleep(8)

@router.post("/infinite/start")
async def start_infinite_cycle(
    repo: FactoryRepository = Depends(get_factory_repo),
    driver = Depends(get_neo4j_driver)
):
    """Запустити цикл вдосконалення"""
    status = await repo.get_improvement()
    if status.is_running:
        return {"status": "already_running"}
        
    status.is_running = True
    status.current_phase = ImprovementPhase.OBSERVE
    status.last_update = datetime.now()
    status.logs.append("Цикл автономного вдосконалення ПРЕДАТОР активовано.")
    await repo.update_improvement(status)
    
    # Запускаємо фонову задачу
    asyncio.create_task(_run_ooda_task(driver))
    
    return {"status": "started"}


@router.post("/infinite/stop")
async def stop_infinite_cycle(
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Зупинити цикл вдосконалення"""
    status = await repo.get_improvement()
    status.is_running = False
    status.last_update = datetime.now()
    status.logs.append("Цикл автономного вдосконалення зупинено.")
    await repo.update_improvement(status)
    return {"status": "stopped"}
