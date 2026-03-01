from __future__ import annotations


"""API Routes для Mission Planner - координація AI агентів."""

import os
import sys

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel


# Додаємо шлях до orchestrator
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../../orchestrator"))

from council.mission_planner import MissionPriority, get_mission_planner


router = APIRouter(prefix="/api/v45/missions", tags=["missions"])


class CreateMissionRequest(BaseModel):
    """Запит на створення місії."""

    title: str
    description: str
    priority: str = "medium"
    context: dict = {}


class MissionResponse(BaseModel):
    """Відповідь з інформацією про місію."""

    mission_id: str
    title: str
    status: str
    priority: str
    progress: float
    tasks: list[dict]
    created_at: str
    started_at: str | None = None
    completed_at: str | None = None


@router.post("/create", response_model=dict)
async def create_mission(request: CreateMissionRequest, background_tasks: BackgroundTasks):
    """🎯 Створити нову місію для AI агентів.

    Місія автоматично розбивається на задачі та призначається агентам.
    """
    planner = get_mission_planner()

    try:
        # Конвертація пріоритету
        priority = MissionPriority(request.priority.lower())
    except ValueError:
        raise HTTPException(400, f"Невірний пріоритет: {request.priority}")

    # Створюємо місію
    mission = await planner.create_mission(
        title=request.title,
        description=request.description,
        priority=priority,
        context=request.context,
    )

    # Плануємо задачі
    mission = await planner.plan_mission(mission)

    # Виконуємо в фоні
    background_tasks.add_task(planner.execute_mission, mission)

    return {
        "success": True,
        "mission_id": mission.mission_id,
        "status": mission.status.value,
        "tasks_count": len(mission.tasks),
        "assigned_agents": [agent.value for agent in mission.assigned_agents],
    }


@router.get("/{mission_id}", response_model=dict)
async def get_mission_status(mission_id: str):
    """📊 Отримати статус місії."""
    planner = get_mission_planner()
    status = planner.get_mission_status(mission_id)

    if not status:
        raise HTTPException(404, f"Місію не знайдено: {mission_id}")

    return status


@router.get("/", response_model=dict)
async def list_missions(status: str | None = None, limit: int = 50):
    """📋 Список всіх місій."""
    planner = get_mission_planner()

    missions = []

    # Активні місії
    for mission in planner.active_missions.values():
        if status is None or mission.status.value == status:
            missions.append(planner.get_mission_status(mission.mission_id))

    # Завершені місії
    for mission in planner.completed_missions[:limit]:
        if status is None or mission.status.value == status:
            missions.append(planner.get_mission_status(mission.mission_id))

    return {"total": len(missions), "missions": missions[:limit]}


@router.get("/agents/stats", response_model=dict)
async def get_agent_stats():
    """🤖 Статистика по AI агентам.

    Показує доступність, навантаження та можливості кожного агента.
    """
    planner = get_mission_planner()
    stats = planner.get_agent_stats()

    # Додаємо загальну статистику
    total_agents = len(stats)
    available_agents = sum(1 for s in stats.values() if s["availability"])

    return {"total_agents": total_agents, "available_agents": available_agents, "agents": stats}


@router.post("/test/threat-analysis", response_model=dict)
async def create_threat_analysis_mission(background_tasks: BackgroundTasks):
    """🧪 Тестова місія: Аналіз загроз.

    Демонстрація роботи мультиагентної системи.
    """
    planner = get_mission_planner()

    mission = await planner.create_mission(
        title="Аналіз кіберзагрози APT-2024-001",
        description="Виявлено підозрілу активність threat від APT групи. "
        "Необхідно провести повний аналіз через SIGINT, CYBINT та OSINT.",
        priority=MissionPriority.HIGH,
        context={
            "threat_id": "APT-2024-001",
            "source_ip": "192.168.1.100",
            "indicators": ["suspicious_network_traffic", "unknown_binary"],
        },
    )

    mission = await planner.plan_mission(mission)
    background_tasks.add_task(planner.execute_mission, mission)

    return {
        "success": True,
        "mission_id": mission.mission_id,
        "message": "Тестова місія створена. Виконується в фоні.",
        "tasks": [task.description for task in mission.tasks],
        "agents": [agent.value for agent in mission.assigned_agents],
    }


@router.post("/test/data-processing", response_model=dict)
async def create_data_processing_mission(background_tasks: BackgroundTasks):
    """🧪 Тестова місія: Обробка даних."""
    planner = get_mission_planner()

    mission = await planner.create_mission(
        title="Обробка датасету Березень_2024.xlsx",
        description="Обробити data та провести валідацію якості результатів",
        priority=MissionPriority.MEDIUM,
        context={"dataset_id": "dataset_march_2024", "file_size_mb": 237},
    )

    mission = await planner.plan_mission(mission)
    background_tasks.add_task(planner.execute_mission, mission)

    return {
        "success": True,
        "mission_id": mission.mission_id,
        "tasks": [task.description for task in mission.tasks],
    }


@router.post("/test/system-health", response_model=dict)
async def create_health_check_mission(background_tasks: BackgroundTasks):
    """🧪 Тестова місія: Перевірка здоров'я системи."""
    planner = get_mission_planner()

    mission = await planner.create_mission(
        title="Комплексна перевірка системи",
        description="Провести здоров'я перевірку performance, security та автоматичне healing",
        priority=MissionPriority.LOW,
        context={},
    )

    mission = await planner.plan_mission(mission)
    background_tasks.add_task(planner.execute_mission, mission)

    return {
        "success": True,
        "mission_id": mission.mission_id,
        "tasks": [task.description for task in mission.tasks],
    }
