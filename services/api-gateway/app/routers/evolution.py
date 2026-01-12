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
