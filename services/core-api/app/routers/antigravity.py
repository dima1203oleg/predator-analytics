"""PREDATOR Antigravity AGI Router
Endpoints для управління автономними AI-агентами розробки
"""

import uuid
from datetime import datetime, UTC
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from app.models.antigravity import (
    AntigravityOrchestratorStatus,
    AntigravityTask,
    AntigravityTaskCreate,
    AntigravityTaskLog,
    AgentStatus,
    AgentType,
    TaskStatus,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/antigravity", tags=["antigravity"])

# In-memory storage для MVP-стабілізації (WRAITH Phase)
# У продуктиві використовуватиметься Neo4j для задач та Redis для логів
STORAGE = {
    "status": {
        "is_running": True,
        "orchestrator_status": "online",
        "active_tasks": 0,
        "completed_tasks": 106,
        "failed_tasks": 2,
        "total_spent_usd": 12.45,
        "budget_limit_usd": 100.0,
        "agents": [
            {"type": "architect", "name": "Architect Agent", "technology": "OpenHands SDK", "is_busy": False, "tasks_completed": 12},
            {"type": "surgeon", "name": "Surgeon Agent", "technology": "Aider + Git", "is_busy": False, "tasks_completed": 45},
            {"type": "qa_browser", "name": "QA Browser Agent", "technology": "Browser-Use + Playwright", "is_busy": False, "tasks_completed": 31},
            {"type": "qa_devtools", "name": "QA DevTools Agent", "technology": "Chrome CDP Protocol", "is_busy": False, "tasks_completed": 18}
        ],
        "llm_gateway_status": "online",
        "sandbox_status": "online",
        "active_model": "GPT-4o / Claude 3.5 Sonnet",
        "last_update": "2026-04-18T05:00:00Z"
    },
    "tasks": [
        AntigravityTask(
            task_id="AGI-8B2A1C",
            description="Оптимізація Neo4j запитів у модулі RiskScoring",
            status=TaskStatus.COMPLETED,
            progress=100,
            actual_cost_usd=1.2,
            finished_at=datetime.now(UTC)
        ),
        AntigravityTask(
            task_id="AGI-4F9D3E",
            description="Виправлення регресії в AMLScoringView UI",
            status=TaskStatus.RUNNING,
            progress=45,
            assigned_agent=AgentType.SURGEON,
            actual_cost_usd=0.35
        )
    ],
    "logs": {
        "AGI-4F9D3E": [
            AntigravityTaskLog(task_id="AGI-4F9D3E", message="Агента Surgeon-Alpha призначено на задачу.", level="info"),
            AntigravityTaskLog(task_id="AGI-4F9D3E", message="Аналіз файлу AMLScoringView.tsx... Виявлено помилку в useEffect.", level="info"),
            AntigravityTaskLog(task_id="AGI-4F9D3E", message="Підготовка патчу (Line 142)...", level="info"),
        ]
    }
}


@router.get("/status", response_model=AntigravityOrchestratorStatus)
async def get_antigravity_status():
    """Отримати поточний статус AGI-оркестратора та агентів"""
    return STORAGE["status"]


@router.get("/tasks", response_model=list[AntigravityTask])
async def get_antigravity_tasks():
    """Отримати список поточних та завершених задач"""
    return STORAGE["tasks"]


@router.post("/tasks", response_model=AntigravityTask)
async def create_antigravity_task(task_in: AntigravityTaskCreate, background_tasks: BackgroundTasks):
    """Створити нову AGI-задачу для автономної обробки"""
    task_id = f"AGI-{str(uuid.uuid4())[:6].upper()}"
    new_task = AntigravityTask(
        task_id=task_id,
        description=task_in.description,
        priority=task_in.priority,
        max_budget_usd=task_in.max_budget_usd,
        created_at=datetime.now(UTC),
        status=TaskStatus.PENDING
    )
    
    STORAGE["tasks"].insert(0, new_task)
    STORAGE["logs"][task_id] = [
        AntigravityTaskLog(
            task_id=task_id, 
            message=f"Задачу прийнято. Пріоритет: {task_in.priority.value}. Очікування вільного агента...", 
            level="info"
        )
    ]
    
    logger.info(f"Створено нову AGI задача: {task_id}")
    return new_task


@router.get("/tasks/{task_id}", response_model=AntigravityTask)
async def get_antigravity_task(task_id: str):
    """Отримати деталі конкретної AGI-задачі з підзадачами"""
    for task in STORAGE["tasks"]:
        if task.task_id == task_id:
            return task
    raise HTTPException(status_code=404, detail="Task not found")


@router.get("/tasks/{task_id}/logs", response_model=list[AntigravityTaskLog])
async def get_antigravity_task_logs(task_id: str):
    """Отримати логи транзакцій для конкретної задачі"""
    return STORAGE["logs"].get(task_id, [])


@router.post("/tasks/{task_id}/cancel")
async def cancel_antigravity_task(task_id: str):
    """Примусове скасування задачі та звільнення агента"""
    for task in STORAGE["tasks"]:
        if task.task_id == task_id:
            if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                raise HTTPException(status_code=400, detail="Cannot cancel finished task")
            
            task.status = TaskStatus.CANCELLED
            task.finished_at = datetime.now(UTC)
            
            if task_id not in STORAGE["logs"]:
                STORAGE["logs"][task_id] = []
            
            STORAGE["logs"][task_id].append(
                AntigravityTaskLog(task_id=task_id, message="Задачу скасовано оператором.", level="warn")
            )
            return {"status": "cancelled", "task_id": task_id}
            
    raise HTTPException(status_code=404, detail="Task not found")
