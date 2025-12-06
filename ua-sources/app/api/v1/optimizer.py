"""
AutoOptimizer API Endpoints

Дозволяє моніторити та керувати автономним самовдосконаленням платформи.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger("api.optimizer")

router = APIRouter(prefix="/optimizer", tags=["Auto-Optimization"])


# ============================================================================
# Models
# ============================================================================

class OptimizationStatus(BaseModel):
    is_running: bool
    total_optimizations_24h: int
    actions_by_type: Dict[str, int]
    quality_gates_status: str
    next_cycle_in_minutes: int
    last_action: Optional[Dict[str, Any]] = None


class TriggerOptimizationRequest(BaseModel):
    force: bool = False
    target: Optional[str] = None  # 'all', 'models', 'infrastructure'


class MetricsSnapshot(BaseModel):
    ndcg_at_10: float
    avg_latency_ms: float
    error_rate: float
    cost_per_1k_requests: float
    user_satisfaction: float
    timestamp: str


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/status", response_model=OptimizationStatus)
async def get_optimizer_status():
    """
    Отримати статус AutoOptimizer.
    
    Показує:
    - Чи працює цикл оптимізації
    - Кількість автоматичних дій за 24 год
    - Статус quality gates
    - Останню виконану дію
    """
    try:
        from app.services.auto_optimizer import get_auto_optimizer
        
        optimizer = get_auto_optimizer()
        report = optimizer.get_optimization_report()
        
        return OptimizationStatus(
            is_running=optimizer.is_running,
            total_optimizations_24h=report["total_optimizations_24h"],
            actions_by_type=report["actions_by_type"],
            quality_gates_status=report["quality_gates_status"],
            next_cycle_in_minutes=report["next_cycle_in_minutes"],
            last_action=report.get("last_cycle", {}).get("action")
        )
        
    except Exception as e:
        logger.error(f"Failed to get optimizer status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger")
async def trigger_optimization(request: TriggerOptimizationRequest):
    """
    Примусово запустити цикл оптимізації.
    
    Корисно для:
    - Тестування автоматизації
    - Негайної реакції на проблеми
    - Ручного запуску після deployments
    
    Args:
        force: Ігнорувати інтервал між циклами
        target: Що оптимізувати ('all', 'models', 'infrastructure')
    """
    try:
        from app.services.auto_optimizer import get_auto_optimizer
        
        optimizer = get_auto_optimizer()
        
        logger.info(f"Manual optimization triggered: force={request.force}, target={request.target}")
        
        # Запускаємо цикл
        await optimizer.run_optimization_cycle()
        
        return {
            "status": "completed",
            "message": "Optimization cycle executed successfully",
            "target": request.target or "all"
        }
        
    except Exception as e:
        logger.error(f"Optimization trigger failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics", response_model=MetricsSnapshot)
async def get_current_metrics():
    """
    Отримати поточні метрики платформи.
    
    Ці метрики використовуються AutoOptimizer для прийняття рішень.
    """
    try:
        from app.services.auto_optimizer import get_auto_optimizer
        from datetime import datetime
        
        optimizer = get_auto_optimizer()
        metrics = await optimizer.analyzer.collect_metrics()
        
        return MetricsSnapshot(
            ndcg_at_10=metrics.get("ndcg_at_10", 0.0),
            avg_latency_ms=metrics.get("avg_latency_ms", 0.0),
            error_rate=metrics.get("error_rate", 0.0),
            cost_per_1k_requests=metrics.get("cost_per_1k_requests", 0.0),
            user_satisfaction=metrics.get("user_satisfaction", 0.0),
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_optimization_history(limit: int = 50):
    """
    Отримати історію автоматичних оптимізацій.
    
    Args:
        limit: Кількість останніх записів
    
    Returns:
        Список дій з timestamps та метриками
    """
    try:
        from app.services.auto_optimizer import get_auto_optimizer
        
        optimizer = get_auto_optimizer()
        history = optimizer.optimization_history[-limit:]
        
        return {
            "total": len(optimizer.optimization_history),
            "showing": len(history),
            "history": history
        }
        
    except Exception as e:
        logger.error(f"Failed to get history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quality-gates")
async def get_quality_gates():
    """
    Показати налаштовані quality gates.
    
    Quality gates - мінімальні пороги якості,
    при порушенні яких тригериться автоматична оптимізація.
    """
    from app.services.auto_optimizer import MetricsAnalyzer
    
    return {
        "gates": MetricsAnalyzer.QUALITY_GATES,
        "description": {
            "ndcg_at_10": "Мінімальна точність пошуку (0-1)",
            "avg_latency_ms": "Максимальна латентність (мс)",
            "error_rate": "Максимальний відсоток помилок (0-1)",
            "cost_per_1k_requests": "Максимальна вартість на 1К запитів ($)",
            "user_satisfaction": "Мінімальний NPS (1-5)"
        }
    }


@router.post("/quality-gates/{metric}")
async def update_quality_gate(metric: str, threshold: float):
    """
    Оновити поріг для quality gate.
    
    Args:
        metric: Назва метрики
        threshold: Новий поріг
    
    Security: Потрібна admin роль
    """
    from app.services.auto_optimizer import MetricsAnalyzer
    
    if metric not in MetricsAnalyzer.QUALITY_GATES:
        raise HTTPException(status_code=404, detail=f"Unknown metric: {metric}")
    
    # TODO: Перевірка admin ролі
    
    old_threshold = MetricsAnalyzer.QUALITY_GATES[metric]
    MetricsAnalyzer.QUALITY_GATES[metric] = threshold
    
    logger.info(f"Quality gate updated: {metric} from {old_threshold} to {threshold}")
    
    return {
        "metric": metric,
        "old_threshold": old_threshold,
        "new_threshold": threshold,
        "updated_at": datetime.now().isoformat()
    }


@router.post("/start")
async def start_optimizer():
    """
    Запустити AutoOptimizer loop (background task).
    
    Цикл буде працювати кожні 15 хвилин.
    """
    import asyncio
    from app.services.auto_optimizer import get_auto_optimizer
    
    optimizer = get_auto_optimizer()
    
    if optimizer.is_running:
        return {"status": "already_running", "message": "AutoOptimizer is already active"}
    
    # Запускаємо в background
    asyncio.create_task(optimizer.start_optimization_loop(interval_minutes=15))
    
    logger.info("AutoOptimizer loop started")
    
    return {
        "status": "started",
        "message": "AutoOptimizer is now running",
        "interval_minutes": 15
    }


@router.post("/stop")
async def stop_optimizer():
    """
    Зупинити AutoOptimizer loop.
    
    Security: Потрібна admin роль
    """
    from app.services.auto_optimizer import get_auto_optimizer
    
    optimizer = get_auto_optimizer()
    optimizer.is_running = False
    
    logger.info("AutoOptimizer loop stopped")
    
    return {"status": "stopped", "message": "AutoOptimizer has been stopped"}
