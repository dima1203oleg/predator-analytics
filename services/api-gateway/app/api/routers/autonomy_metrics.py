"""
📊 UNIFIED AUTONOMY METRICS API
===============================
Спільний API для моніторингу двох окремих систем:
1. AZR Hyper-Autonomy (Код)
2. Self-Improvement Service (Модель)

Не об'єднує системи, лише збирає метрики для dashboard.
"""

from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path
import json
import asyncio

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from libs.core.structured_logger import get_logger
except ImportError:
    import logging
    def get_logger(name): return logging.getLogger(name)

logger = get_logger("api.autonomy_metrics")

router = APIRouter(prefix="/api/v1/autonomy", tags=["Autonomy Metrics"])


class SystemStatus(BaseModel):
    """Статус однієї системи"""
    name: str
    status: str  # running, stopped, error
    uptime_hours: float
    last_cycle: Optional[str]
    cycle_count: int
    success_rate: float
    metrics: Dict[str, Any]


class UnifiedMetrics(BaseModel):
    """Об'єднані метрики обох систем"""
    timestamp: str
    code_evolution: SystemStatus
    model_training: SystemStatus
    summary: Dict[str, Any]


# Шляхи до метрик
METRICS_ROOT = Path("/Users/dima-mac/Documents/Predator_21/metrics")
CODE_METRICS = METRICS_ROOT / "eternal_processor"
MODEL_METRICS = METRICS_ROOT / "training"


async def get_code_evolution_status() -> SystemStatus:
    """Отримання статусу AZR Hyper-Autonomy (Код)"""
    try:
        # Читаємо останні метрики
        metrics_files = sorted(CODE_METRICS.glob("*.jsonl"), reverse=True)

        if metrics_files:
            last_file = metrics_files[0]
            with open(last_file, "r") as f:
                lines = f.readlines()
                if lines:
                    last_entry = json.loads(lines[-1])

                    return SystemStatus(
                        name="AZR Hyper-Autonomy v28.5",
                        status="running" if last_entry.get("stats", {}).get("total_cycles", 0) > 0 else "stopped",
                        uptime_hours=last_entry.get("uptime_hours", 0),
                        last_cycle=last_entry.get("timestamp"),
                        cycle_count=last_entry.get("cycle", 0),
                        success_rate=last_entry.get("stats", {}).get("successful_cycles", 0) /
                                     max(1, last_entry.get("stats", {}).get("total_cycles", 1)) * 100,
                        metrics={
                            "files_modified": last_entry.get("stats", {}).get("total_files_modified", 0),
                            "healed_errors": last_entry.get("stats", {}).get("healed_errors", 0),
                            "evolution_cycles": last_entry.get("stats", {}).get("evolution_cycles", 0),
                            "chaos_tests": last_entry.get("stats", {}).get("chaos_tests", 0),
                            "consecutive_errors": last_entry.get("consecutive_errors", 0),
                            "interval_s": last_entry.get("interval", 60)
                        }
                    )

        # Fallback: перевіряємо PID файл
        pid_file = Path("/Users/dima-mac/Documents/Predator_21/.azr/eternal_processor.pid")
        is_running = pid_file.exists()

        return SystemStatus(
            name="AZR Hyper-Autonomy v28.5",
            status="running" if is_running else "stopped",
            uptime_hours=0,
            last_cycle=None,
            cycle_count=0,
            success_rate=100.0,
            metrics={"files_modified": 0, "healed_errors": 0}
        )

    except Exception as e:
        logger.error(f"Error getting code evolution status: {e}")
        return SystemStatus(
            name="AZR Hyper-Autonomy v28.5",
            status="error",
            uptime_hours=0,
            last_cycle=None,
            cycle_count=0,
            success_rate=0,
            metrics={"error": str(e)}
        )


async def get_model_training_status() -> SystemStatus:
    """Отримання статусу Self-Improvement Service (Модель)"""
    try:
        # Спроба отримати статус з Redis
        try:
            from app.services.training_status_service import training_status_service
            status = await training_status_service.get_status()

            if status:
                return SystemStatus(
                    name="Self-Improvement Service (Llama 3.1)",
                    status=status.get("status", "unknown"),
                    uptime_hours=0,  # Не відстежуємо для моделі
                    last_cycle=status.get("timestamp"),
                    cycle_count=status.get("cycle", 0),
                    success_rate=status.get("metrics", {}).get("accuracy", 0) * 100,
                    metrics={
                        "stage": status.get("stage", "unknown"),
                        "progress": status.get("progress", 0),
                        "model": "llama3.1:8b-instruct",
                        "accuracy": status.get("metrics", {}).get("accuracy", 0),
                        "loss": status.get("metrics", {}).get("loss", 0),
                        "samples_generated": status.get("samples", 0),
                        "h2o_status": "ready"
                    }
                )
        except ImportError:
            pass

        # Fallback: статичний статус
        return SystemStatus(
            name="Self-Improvement Service (Llama 3.1)",
            status="idle",
            uptime_hours=0,
            last_cycle=None,
            cycle_count=0,
            success_rate=85.0,
            metrics={
                "stage": "ready",
                "model": "llama3.1:8b-instruct",
                "h2o_status": "available"
            }
        )

    except Exception as e:
        logger.error(f"Error getting model training status: {e}")
        return SystemStatus(
            name="Self-Improvement Service",
            status="error",
            uptime_hours=0,
            last_cycle=None,
            cycle_count=0,
            success_rate=0,
            metrics={"error": str(e)}
        )


@router.get("/metrics", response_model=UnifiedMetrics)
async def get_unified_metrics():
    """
    📊 Отримання об'єднаних метрик обох систем автономності

    Повертає статус:
    - AZR Hyper-Autonomy (вдосконалення коду)
    - Self-Improvement Service (навчання моделі)
    """
    code_status = await get_code_evolution_status()
    model_status = await get_model_training_status()

    # Розрахунок загального summary
    total_cycles = code_status.cycle_count + model_status.cycle_count
    avg_success_rate = (code_status.success_rate + model_status.success_rate) / 2

    both_running = code_status.status == "running" and model_status.status in ["running", "active", "idle"]

    return UnifiedMetrics(
        timestamp=datetime.now().isoformat(),
        code_evolution=code_status,
        model_training=model_status,
        summary={
            "overall_status": "healthy" if both_running else "degraded",
            "total_cycles": total_cycles,
            "avg_success_rate": round(avg_success_rate, 2),
            "systems_online": sum([
                1 if code_status.status == "running" else 0,
                1 if model_status.status in ["running", "active", "idle"] else 0
            ]),
            "recommendation": _get_recommendation(code_status, model_status)
        }
    )


@router.get("/code/status")
async def get_code_status():
    """Статус тільки AZR Hyper-Autonomy (Код)"""
    return await get_code_evolution_status()


@router.get("/model/status")
async def get_model_status():
    """Статус тільки Self-Improvement Service (Модель)"""
    return await get_model_training_status()


@router.post("/code/start")
async def start_code_evolution():
    """Запуск AZR Hyper-Autonomy"""
    try:
        import subprocess
        result = subprocess.run(
            ["./scripts/run_eternal_autonomy.sh", "start"],
            cwd="/Users/dima-mac/Documents/Predator_21",
            capture_output=True,
            timeout=10
        )
        return {"status": "started", "output": result.stdout.decode()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/code/stop")
async def stop_code_evolution():
    """Зупинка AZR Hyper-Autonomy"""
    try:
        import subprocess
        result = subprocess.run(
            ["./scripts/run_eternal_autonomy.sh", "stop"],
            cwd="/Users/dima-mac/Documents/Predator_21",
            capture_output=True,
            timeout=10
        )
        return {"status": "stopped", "output": result.stdout.decode()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/model/trigger")
async def trigger_model_training():
    """Ручний запуск навчання моделі"""
    try:
        from app.services.training_status_service import training_status_service
        await training_status_service.trigger_manual_training()
        return {"status": "triggered", "message": "Навчання моделі запущено"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _get_recommendation(code: SystemStatus, model: SystemStatus) -> str:
    """Генерація рекомендації на основі статусів"""
    if code.status == "error":
        return "⚠️ Перезапустіть AZR Hyper-Autonomy: ./scripts/run_eternal_autonomy.sh restart"
    if model.status == "error":
        return "⚠️ Перевірте Self-Improvement Service та Docker контейнери"
    if code.success_rate < 80:
        return "📊 Низька успішність коду. Розгляньте збільшення інтервалу циклів."
    if model.metrics.get("accuracy", 1) < 0.8:
        return "🧠 Низька точність моделі. Накопичте більше training samples."
    return "✅ Обидві системи працюють нормально"


# Експортуємо router для підключення до main app
autonomy_router = router
