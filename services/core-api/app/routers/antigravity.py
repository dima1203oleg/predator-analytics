"""PREDATOR Antigravity AGI Router
Endpoints для управління автономними AI-агентами розробки (v1.5-LIVE)
"""


from fastapi import APIRouter, Body, HTTPException

from app.models.antigravity import (
    AntigravityOrchestratorStatus,
    AntigravityTask,
    AntigravityTaskCreate,
    AntigravityTaskLog,
)
from app.services.antigravity_orchestrator import orchestrator
from app.services.wargaming_engine import wargaming_engine

router = APIRouter(prefix="/antigravity", tags=["AGI Orchestrator"])


@router.get("/status", response_model=AntigravityOrchestratorStatus)
async def get_orchestrator_status():
    """Отримати поточний стан AGI-оркестратора та Matrix 4 агентів."""
    return orchestrator.get_status()

@router.get("/tasks", response_model=list[AntigravityTask])
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

@router.get("/logs", response_model=list[AntigravityTaskLog])
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

@router.get("/vram")
async def get_vram_status():
    """Отримати статус VRAM від Sentinel Watchdog."""
    from app.services.vram_watchdog import vram_sentinel
    return await vram_sentinel.get_stats()

@router.post("/simulate-horizon")
async def simulate_horizon_threat(scenario_id: str | None = Body(None, embed=True)):
    """Ініціювати стратегічну симуляцію 'War-gaming Horizon'.
    Якщо scenario_id не вказано, буде обрано пріоритетний сценарій.
    """
    if not scenario_id:
        # Отримуємо сценарії та беремо перший
        scenarios = await wargaming_engine.generate_scenarios()
        scenario_id = scenarios[0]['id'] if scenarios else "WAR-01"

    return await wargaming_engine.simulate_impact(scenario_id)

@router.get("/audit/trigger")
async def trigger_sovereign_audit():
    """Запустити повний Forensic-аудит 9 площин контролю системи."""
    from app.services.autonomous_audit import sovereign_audit_engine
    return await sovereign_audit_engine.execute_full_forensic_audit()

@router.get("/audit/reports")
async def get_certification_reports():
    """Отримати список згенерованих звітів операційної сертифікації та їх зміст."""
    import os

    from app.services.autonomous_audit import CERTIFICATION_DIR

    reports = []
    if not os.path.exists(CERTIFICATION_DIR):
        return reports

    for filename in sorted(os.listdir(CERTIFICATION_DIR)):
        if filename.endswith(".md") or filename.endswith(".json"):
            path = os.path.join(CERTIFICATION_DIR, filename)
            try:
                with open(path, encoding="utf-8") as f:
                    content = f.read()
                reports.append({
                    "name": filename,
                    "title": filename.replace("_", " ").replace(".md", "").title(),
                    "content": content
                })
            except Exception as e:
                reports.append({
                    "name": filename,
                    "error": str(e)
                })
    return reports

@router.post("/audit/autofix")
async def trigger_manual_autofix(failed_planes: list[str] = Body(..., embed=True)):
    """Примусово запустити контур автоматичного відновлення (AutoFix) для вказаних площин."""
    from app.services.autonomous_audit import sovereign_audit_engine
    success = await sovereign_audit_engine.trigger_autofix_pipeline(failed_planes)
    return {
        "status": "success" if success else "failed",
        "message": "Контур самовідновлення успішно виконано." if success else "Помилка виконання самовідновлення."
    }

