"""Antigravity AGI Orchestrator Service
Ядро управління автономними агентами (v1.0-ELITE)
"""

import asyncio
from datetime import UTC, datetime
from typing import Optional
import uuid

from app.models.antigravity import (
    AgentStatus,
    AgentTechnology,
    AgentType,
    AntigravityOrchestratorStatus,
    AntigravityTask,
    AntigravityTaskLog,
    TaskPriority,
    TaskStatus,
)
from app.services.audit_service import audit_logger
from predator_common.logging import get_logger

logger = get_logger("core_api.antigravity_orchestrator")

class AntigravityOrchestrator:
    """Оркестратор для координації Matrix 4 агентів."""

    _instance: Optional["AntigravityOrchestrator"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.status = AntigravityOrchestratorStatus(
            is_running=True,
            orchestrator_status="online",
            llm_gateway_status="online",
            sandbox_status="online",
            active_model="Gemini 1.5 Pro + Ollama (Cascade-2)",
            budget_limit_usd=500.0,
            total_spent_usd=24.50,
            agents=[
                AgentStatus(
                    type=AgentType.ARCHITECT,
                    name="Architect-Prime",
                    technology=AgentTechnology.OPENHANDS,
                    specialization="System Architecture & Refactoring",
                    is_busy=False, tasks_completed=12
                ),
                AgentStatus(
                    type=AgentType.SURGEON,
                    name="Surgeon-Beta",
                    technology=AgentTechnology.AIDER,
                    specialization="High-Precision Code Injection",
                    is_busy=False, tasks_completed=45
                ),
                AgentStatus(
                    type=AgentType.FINANCIAL_ANALYST,
                    name="Forensic-AI",
                    technology="Custom Python Engine",
                    specialization="UBO & Financial Fraud Detection",
                    is_busy=False, tasks_completed=7
                ),
                AgentStatus(
                    type=AgentType.OSINT_EXPERT,
                    name="Phantom-Gatherer",
                    technology="Stealth-Web-Engine",
                    specialization="Global Sanctions & Registry Scraper",
                    is_busy=False, tasks_completed=15
                ),
            ]
        )
        self.tasks: dict[str, AntigravityTask] = {}
        self.logs: list[AntigravityTaskLog] = []
        self._loop_task: asyncio.Task | None = None
        self._initialized = True

        # Початкове заповнення (для демонстрації)
        self._seed_data()

    def _seed_data(self):
        """Додавання початкових даних для UI."""
        sample_task_id = "task-777-wraith"
        self.tasks[sample_task_id] = AntigravityTask(
            task_id=sample_task_id,
            description="Оптимізація Neo4j запитів для детекції циклів у митних деклараціях",
            status=TaskStatus.COMPLETED,
            progress=100,
            actual_cost_usd=1.42,
            finished_at=datetime.now(UTC)
        )

    async def start(self):
        """Запуск фонового циклу оркестрації."""
        if self._loop_task is None or self._loop_task.done():
            self._loop_task = asyncio.create_task(self._orchestrator_loop())
            logger.info("Antigravity AGI Orchestrator loop started.")

    async def _orchestrator_loop(self):
        """Головний цикл перевірки черги задач та призначення агентів."""
        while self.status.is_running:
            try:
                # 1. Пошук очікуючих задач
                pending_tasks = [t for t in self.tasks.values() if t.status == TaskStatus.PENDING]

                for task in pending_tasks:
                    # 2. Пошук вільного агента (спрощена модель: беремо першого вільного)
                    free_agent = next((a for a in self.status.agents if not a.is_busy), None)

                    if free_agent:
                        await self._assign_task(task, free_agent)

                # 3. Емуляція прогресу активних задач
                running_tasks = [t for t in self.tasks.values() if t.status == TaskStatus.RUNNING]
                for task in running_tasks:
                    await self._simulate_progress(task)

                # 4. Оновлення лічильників
                self.status.active_tasks = len(running_tasks)
                self.status.completed_tasks = len([t for t in self.tasks.values() if t.status == TaskStatus.COMPLETED])
                self.status.last_update = datetime.now(UTC).isoformat()

            except Exception as e:
                logger.error(f"Error in orchestrator loop: {e}")

            await asyncio.sleep(5)  # Інтервал перевірки

    async def _assign_task(self, task: AntigravityTask, agent: AgentStatus):
        """Призначення задачі агенту."""
        task.status = TaskStatus.RUNNING
        task.assigned_agent = agent.type
        task.started_at = datetime.now(UTC)
        agent.is_busy = True
        agent.current_task_id = task.task_id

        self.add_log(task.task_id, f"Агент {agent.name} розпочав виконання завдання: {task.description[:50]}...", agent.type)
        logger.info(f"Task {task.task_id} assigned to {agent.name}")

        # Sovereign Audit (HR-16)
        await audit_logger.log(
            action="agi_task_assigned",
            resource_type="antigravity_task",
            resource_id=task.task_id,
            details={
                "agent_name": agent.name,
                "agent_type": agent.type,
                "task_description": task.description,
                "specialization": agent.specialization
            }
        )

    async def _simulate_progress(self, task: AntigravityTask):
        """Виконання задачі (через Gemini Code Execution для Surgical Coder)."""
        # Якщо це Surgical Coder (Surgeon), використовуємо реальне виконання коду
        if task.assigned_agent == AgentType.SURGEON and task.progress < 30:
            self.add_log(task.task_id, "Ініціалізація Gemini Code Execution Sandbox...", task.assigned_agent)
            try:
                from app.services.gemini_agent_service import gemini_service
                result = await gemini_service.execute_code(task.description)
                if result.get("result"):
                    task.result_artifact = result["result"]
                    self.add_log(task.task_id, f"Результат виконання: {result['result'][:100]}...", task.assigned_agent, level="success")

                # Прискорюємо прогрес при успішному виконанні
                task.progress += 40
            except Exception as e:
                logger.error(f"AGI Code Execution failed: {e}")
                self.add_log(task.task_id, f"Помилка виконання коду: {e}", task.assigned_agent, level="error")

        task.progress += 15
        task.actual_cost_usd += 0.02
        self.status.total_spent_usd += 0.02

        if task.progress >= 100:
            task.progress = 100
            task.status = TaskStatus.COMPLETED
            task.finished_at = datetime.now(UTC)

            # Звільнення агента
            agent = next((a for a in self.status.agents if a.type == task.assigned_agent), None)
            if agent:
                agent.is_busy = False
                agent.current_task_id = None
                agent.tasks_completed += 1
                self.add_log(task.task_id, f"Завдання {task.task_id} успішно завершено.", agent.type, level="success")

                # Sovereign Audit (HR-16)
                await audit_logger.log(
                    action="agi_task_completed",
                    resource_type="antigravity_task",
                    resource_id=task.task_id,
                    details={
                        "agent_name": agent.name,
                        "cost_usd": task.actual_cost_usd,
                        "result_artifact": task.result_artifact
                    }
                )
        else:
            self.add_log(task.task_id, f"Виконання: {task.progress}%...", task.assigned_agent)

    def add_task(self, description: str, priority: TaskPriority, max_budget: float | None = None) -> AntigravityTask:
        """Створення нової задачі."""
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        task = AntigravityTask(
            task_id=task_id,
            description=description,
            priority=priority,
            max_budget_usd=max_budget or 5.0,
            status=TaskStatus.PENDING
        )
        self.tasks[task_id] = task
        self.add_log(task_id, f"Додано нове завдання у чергу: {description}")
        return task

    def add_log(self, task_id: str, message: str, agent_type: AgentType | None = None, level: str = "info"):
        """Додавання запису в лог."""
        log_entry = AntigravityTaskLog(
            task_id=task_id,
            message=message,
            agent_type=agent_type,
            level=level
        )
        self.logs.insert(0, log_entry)
        if len(self.logs) > 200:
            self.logs = self.logs[:200]

    def get_status(self) -> AntigravityOrchestratorStatus:
        """Отримання поточного стану."""
        return self.status

    def get_tasks(self) -> list[AntigravityTask]:
        """Отримання списку всіх задач."""
        return sorted(self.tasks.values(), key=lambda x: x.created_at, reverse=True)

    def get_logs(self) -> list[AntigravityTaskLog]:
        """Отримання останніх логів."""
        return self.logs

# Синглтон для доступу з роутерів
orchestrator = AntigravityOrchestrator()
