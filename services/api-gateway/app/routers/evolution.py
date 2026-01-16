"""
Predator Analytics - Evolution Router
NAS (Neural Architecture Search) and Self-Evolution endpoints
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import select, desc
from app.core.db import async_session_maker
from app.models import NasTournament as NasTournamentDB, NasCandidate as NasCandidateDB
router = APIRouter(prefix="/evolution", tags=["Evolution"])


class EvolutionPhase(str, Enum):
    IDLE = "IDLE"
    DETECTION = "DETECTION"
    MUTATION = "MUTATION"
    EVALUATION = "EVALUATION"
    SELECTION = "SELECTION"
    DEPLOYMENT = "DEPLOYMENT"


class EvolutionStatus(BaseModel):
    phase: EvolutionPhase
    progress: int
    active: bool
    logs: List[str]
    current_generation: int
    best_fitness: float


class EvolutionConfig(BaseModel):
    name: Optional[str] = "Auto-Evolution Cycle"
    dataset_id: Optional[str] = "system"
    strategy: Optional[str] = "EVOLUTIONARY"
    population_size: int = 10
    mutation_rate: float = 0.1
    crossover_rate: float = 0.7
    max_generations: int = 100
    fitness_threshold: float = 0.95


# In-memory state (would be Redis in production)
_evolution_state = EvolutionStatus(
    phase=EvolutionPhase.IDLE,
    progress=0,
    active=False,
    logs=["System ready for evolution cycle"],
    current_generation=0,
    best_fitness=0.0
)


@router.get("/status", response_model=EvolutionStatus)
async def get_evolution_status():
    """Get current NAS/Evolution status"""
    return _evolution_state


@router.post("/start")
async def start_evolution(
    config: Optional[EvolutionConfig] = None,
    background_tasks: BackgroundTasks = None
):
    """Start a new evolution cycle"""
    global _evolution_state

    if _evolution_state.active:
        raise HTTPException(status_code=409, detail="Evolution already in progress")

    _evolution_state = EvolutionStatus(
        phase=EvolutionPhase.DETECTION,
        progress=5,
        active=True,
        logs=[
            f"[{datetime.now(timezone.utc).isoformat()}] Evolution cycle initiated",
            "[NAS] Scanning codebase for optimization targets...",
            "[BRAIN] Initializing neural architecture search...",
        ],
        current_generation=1,
        best_fitness=0.0
    )

    # Create real tournament record
    tournament_id = f"t-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    async with async_session_maker() as session:
        new_tournament = NasTournamentDB(
            id=tournament_id,
            topic_id="evolution_cycle",
            name=config.name if config else f"Evolution Cycle #{_evolution_state.current_generation}",
            dataset_id=config.dataset_id if config else "system",
            strategy=config.strategy if config else "EVOLUTIONARY",
            status="RUNNING",
            current_generation=1,
            max_generations=config.max_generations if config else 10,
            start_time=datetime.now(timezone.utc),
            configuration=config.dict() if config else {}
        )
        session.add(new_tournament)
        await session.commit()

    return {
        "message": "Evolution started",
        "status": _evolution_state,
        "tournament_id": tournament_id
    }


@router.post("/stop")
async def stop_evolution():
    """Stop current evolution cycle"""
    global _evolution_state

    if not _evolution_state.active:
        raise HTTPException(status_code=400, detail="No evolution in progress")

    _evolution_state.active = False
    _evolution_state.phase = EvolutionPhase.IDLE
    _evolution_state.logs.append(f"[{datetime.now(timezone.utc).isoformat()}] Evolution stopped by user")

    return {"message": "Evolution stopped", "status": _evolution_state}


@router.get("/history")
async def get_evolution_history(limit: int = 10):
    """Get evolution history"""
    return {
        "generations": [],
        "total": 0,
        "message": "History tracking enabled"
    }


# --- NAS EXTENSIONS ---

class NasTournament(BaseModel):
    id: str
    topicId: str
    name: str
    datasetId: str
    strategy: str
    status: str
    current_generation: int
    max_generations: int
    candidates_count: int
    best_score: float
    start_time: str
    duration: str

class ModelCandidate(BaseModel):
    id: str
    tournament_id: str
    architecture: str
    generation: int
    metrics: Dict[str, Any]
    status: str
    provider: str

@router.get("/tournaments", response_model=List[NasTournament])
async def get_nas_tournaments():
    """Get list of NAS tournaments from Real DB"""
    try:
        async with async_session_maker() as session:
            result = await session.execute(
                select(NasTournamentDB).order_by(desc(NasTournamentDB.start_time))
            )
            tournaments = result.scalars().all()

            return [
                NasTournament(
                    id=t.id,
                    topicId=t.topic_id,
                    name=t.name,
                    datasetId=t.dataset_id or "system",
                    strategy=t.strategy,
                    status=t.status,
                    current_generation=t.current_generation,
                    max_generations=t.max_generations,
                    candidates_count=0, # TODO: join count
                    best_score=t.best_score,
                    start_time=t.start_time.isoformat() if t.start_time else "",
                    duration="-" # Calc duration
                ) for t in tournaments
            ]
    except Exception as e:
        # Fallback to empty list or handle error
        print(f"DB Error: {e}")
        return []

@router.get("/models", response_model=List[ModelCandidate])
async def get_nas_models(tournament_id: Optional[str] = None):
    """Get model candidates from Real DB"""
    try:
        async with async_session_maker() as session:
            query = select(NasCandidateDB).order_by(desc(NasCandidateDB.metrics['accuracy']))
            if tournament_id:
                query = query.where(NasCandidateDB.tournament_id == tournament_id)

            result = await session.execute(query)
            candidates = result.scalars().all()

            return [
                ModelCandidate(
                    id=c.id,
                    tournament_id=c.tournament_id,
                    architecture=c.architecture,
                    generation=c.generation,
                    metrics=c.metrics,
                    status=c.status,
                    provider=c.provider
                ) for c in candidates
            ]
    except Exception:
        return []

# ============================================================================
# UNIFIED AUTONOMY METRICS (v27.0)
# ============================================================================

from pathlib import Path
import json
import os

class SystemStatus(BaseModel):
    """Status of a single autonomous system"""
    name: str
    status: str  # running, stopped, error
    uptime_hours: float
    last_cycle: Optional[str]
    cycle_count: int
    success_rate: float
    metrics: Dict[str, Any]

class UnifiedMetrics(BaseModel):
    """Combined metrics for both autonomy systems"""
    timestamp: str
    code_evolution: SystemStatus
    model_training: SystemStatus
    summary: Dict[str, Any]

# Metrics paths
METRICS_ROOT = Path("/Users/dima-mac/Documents/Predator_21/metrics")
CODE_METRICS = METRICS_ROOT / "eternal_processor"


async def get_code_evolution_status() -> SystemStatus:
    """Get AZR Hyper-Autonomy (Code) Status"""
    try:
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

        # Fallback: check PID
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
    """Get Self-Improvement Service (Model) Status"""
    try:
        # Try to get from Redis/Service via import
        try:
            from app.services.training_status_service import training_status_service
            status = await training_status_service.get_status()
            if status:
                return SystemStatus(
                    name="Self-Improvement Service (Llama 3.1)",
                    status=status.get("status", "unknown"),
                    uptime_hours=0,
                    last_cycle=status.get("timestamp"),
                    cycle_count=status.get("cycle", 0),
                    success_rate=status.get("metrics", {}).get("accuracy", 0) * 100,
                    metrics={
                        "stage": status.get("stage", "unknown"),
                        "progress": status.get("progress", 0),
                        "model": "llama3.1:8b-instruct",
                        "accuracy": status.get("metrics", {}).get("accuracy", 0),
                        "loss": status.get("metrics", {}).get("loss", 0),
                        "samples_generated": status.get("samples", 0)
                    }
                )
        except ImportError:
            pass

        return SystemStatus(
            name="Self-Improvement Service (Llama 3.1)",
            status="idle",
            uptime_hours=0,
            last_cycle=None,
            cycle_count=0,
            success_rate=85.0,
            metrics={"stage": "ready", "model": "llama3.1:8b-instruct"}
        )

    except Exception as e:
        return SystemStatus(
            name="Self-Improvement Service",
            status="error",
            uptime_hours=0,
            last_cycle=None,
            cycle_count=0,
            success_rate=0,
            metrics={"error": str(e)}
        )

def _get_recommendation(code: SystemStatus, model: SystemStatus) -> str:
    if code.status == "error": return "⚠️ Restart AZR: ./scripts/run_eternal_autonomy.sh restart"
    if model.status == "error": return "⚠️ Check Self-Improvement Service"
    if code.success_rate < 80: return "📊 Low code success rate. Check logs."
    if model.metrics.get("accuracy", 1) < 0.8: return "🧠 Low model accuracy. Increase training samples."
    return "✅ Systems Operational"

@router.get("/metrics", response_model=UnifiedMetrics)
async def get_unified_metrics():
    """Get combined metrics for Evolution Dashboard"""
    code_status = await get_code_evolution_status()
    model_status = await get_model_training_status()

    total_cycles = code_status.cycle_count + model_status.cycle_count
    avg_success_rate = (code_status.success_rate + model_status.success_rate) / 2
    both_running = code_status.status == "running" and model_status.status in ["running", "active", "idle"]

    return UnifiedMetrics(
        timestamp=datetime.now(timezone.utc).isoformat(),
        code_evolution=code_status,
        model_training=model_status,
        summary={
            "overall_status": "healthy" if both_running else "degraded",
            "total_cycles": total_cycles,
            "avg_success_rate": round(avg_success_rate, 2),
            "systems_online": sum([1 if code_status.status == "running" else 0, 1 if model_status.status in ["running", "active", "idle"] else 0]),
            "recommendation": _get_recommendation(code_status, model_status)
        }
    )
