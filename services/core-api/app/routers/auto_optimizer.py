from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.services.auto_optimizer import auto_optimizer
from typing import Dict, Any

router = APIRouter()

# Змінна для відстеження статусу останнього циклу
latest_cycle_status = {
    "is_running": False,
    "last_result": None
}

async def run_optimizer_background():
    global latest_cycle_status
    latest_cycle_status["is_running"] = True
    try:
        result = await auto_optimizer.run_full_cycle()
        latest_cycle_status["last_result"] = result
    except Exception as e:
        latest_cycle_status["last_result"] = {"error": str(e)}
    finally:
        latest_cycle_status["is_running"] = False

@router.post("/cycle/start")
async def start_optimizer_cycle(background_tasks: BackgroundTasks):
    global latest_cycle_status
    if latest_cycle_status["is_running"]:
        return {"status": "error", "message": "Цикл самовдосконалення вже виконується."}
        
    background_tasks.add_task(run_optimizer_background)
    return {"status": "started", "message": "Цикл авто-оптимізації та генерації датасету запущено у фоні."}

@router.get("/status")
async def get_optimizer_status():
    global latest_cycle_status
    return latest_cycle_status

@router.get("/datasets")
async def get_datasets():
    try:
        datasets = auto_optimizer.list_datasets()
        return {"datasets": datasets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
