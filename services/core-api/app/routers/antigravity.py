"""PREDATOR Antigravity AGI Router
Endpoints для управління автономними AI-агентами розробки (v1.5-LIVE)
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.antigravity import (
    AntigravityOrchestratorStatus, 
    AntigravityTask, 
    AntigravityTaskLog,
    AntigravityTaskCreate
)
from app.services.antigravity_orchestrator import orchestrator

router = APIRouter(prefix="/antigravity", tags=["AGI Orchestrator"])

@router.on_event("startup")
async def startup_event():
    """Запуск циклу оркестрації при старті додатку (WRAITH Phase)."""
    await orchestrator.start()

@router.get("/status", response_model=AntigravityOrchestratorStatus)
async def get_orchestrator_status():
    """Отримати поточний стан AGI-оркестратора та Matrix 4 агентів."""
    return orchestrator.get_status()

@router.get("/tasks", response_model=List[AntigravityTask])
async def get_all_tasks():
    """Отримати список усіх задач (черга + виконання + завершені)."""
    return orchestrator.get_tasks()

@router.post("/tasks", response_model=AntigravityTask)
async def create_new_task(task_input: AntigravityTaskCreate):
    """Створити нову AGI-задачу для автономної обробки матрицею агентів."""
    return orchestrator.add_task(
        description=task_input.description,
        priority=task_input.priority,
        max_budget=task_input.max_budget_usd
    )

@router.get("/logs", response_model=List[AntigravityTaskLog])
async def get_system_logs():
    """Отримати глобальний лог транзакцій оркестрації."""
    return orchestrator.get_logs()

@router.get("/tasks/{task_id}", response_model=AntigravityTask)
async def get_task_details(task_id: str):
    """Отримати детальну інформацію про конкретну задачу."""
    for task in orchestrator.get_tasks():
        if task.task_id == task_id:
            return task
    raise HTTPException(status_code=404, detail="Task not found")
