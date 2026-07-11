"""PREDATOR Neural Training API Router
Ендпоінти для керування тренуванням моделей
"""

import asyncio
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/neural", tags=["neural"])

class TrainingStatus(BaseModel):
    status: str
    activeModel: str | None
    progress: int

# In-memory стан для симуляції тренування
_training_state = {
    "status": "IDLE",
    "activeModel": None,
    "progress": 0,
    "stats": []
}

async def _simulate_training(model_name: str):
    _training_state["status"] = "TRAINING"
    _training_state["activeModel"] = model_name
    _training_state["progress"] = 0
    _training_state["stats"] = []
    
    epochs = 10
    for epoch in range(1, epochs + 1):
        if _training_state["status"] != "TRAINING":
            break
        
        await asyncio.sleep(2)
        _training_state["progress"] = int((epoch / epochs) * 100)
        _training_state["stats"].append({
            "epoch": epoch,
            "loss": max(0.1, 1.0 - (epoch * 0.08)),
            "accuracy": min(99.0, 50.0 + (epoch * 4.5)),
            "val_loss": max(0.15, 1.1 - (epoch * 0.07))
        })
    
    if _training_state["status"] == "TRAINING":
        _training_state["status"] = "COMPLETED"

@router.get("/training/status", response_model=TrainingStatus)
async def get_training_status():
    return TrainingStatus(
        status=_training_state["status"],
        activeModel=_training_state["activeModel"],
        progress=_training_state["progress"]
    )

@router.get("/training/stats", response_model=List[dict])
async def get_training_stats():
    return _training_state["stats"]

class StartTrainingRequest(BaseModel):
    model: str = 'Predator-v45-X-Core'

@router.post("/training/start")
async def start_training(req: StartTrainingRequest, background_tasks: BackgroundTasks):
    if _training_state["status"] == "TRAINING":
        return {"status": "already_training"}
    
    background_tasks.add_task(_simulate_training, req.model)
    return {"status": "started"}

@router.post("/training/stop")
async def stop_training():
    _training_state["status"] = "IDLE"
    _training_state["progress"] = 0
    return {"status": "stopped"}
