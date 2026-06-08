import asyncio
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Optional
import uuid

if TYPE_CHECKING:
    from fastapi import FastAPI

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
    """Оркестратор для координації Matrix 4 агентів (v1.2-SOVEREIGN)."""

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
            active_model="GLM-4 / Gemini 1.5 Pro (Hybrid-Cascade)",
            budget_limit_usd=1000.0,
            total_spent_usd=42.15,
            agents=[
                AgentStatus(
                    type=AgentType.ARCHITECT,
                    name="Architect-Prime",
                    technology=AgentTechnology.OPENHANDS,
                    specialization="Deep Architectural Audit & Refactoring",
                    is_busy=False, tasks_completed=15
                ),
                AgentStatus(
                    type=AgentType.SURGEON,
                    name="Surgeon-Alpha",
                    technology=AgentTechnology.AIDER,
                    specialization="Surgical Code Injections & Hotfixes",
                    is_busy=False, tasks_completed=58
                ),
                AgentStatus(
                    type=AgentType.FINANCIAL_ANALYST,
                    name="Forensic-AI",
                    technology="Custom Graph-Neural Engine",
                    specialization="Money Laundering & UBO Detection",
                    is_busy=False, tasks_completed=12
                ),
                AgentStatus(
                    type=AgentType.OSINT_EXPERT,
                    name="Phantom-Scraper",
                    technology="Stealth-Browser-Matrix",
                    specialization="Registry Intelligence & Global Sanctions",
                    is_busy=False, tasks_completed=22
                ),
                AgentStatus(
                    type=AgentType.RED_TEAMER,
                    name="Chaos-Bender",
                    technology="Adversarial ML",
                    specialization="Stress-testing Customs Loopholes & Fraud Simulation",
                    is_busy=False, tasks_completed=7
                ),
            ]
        )
        self.tasks: dict[str, AntigravityTask] = {}
        self.logs: list[AntigravityTaskLog] = []
        self._loop_task: asyncio.Task | None = None
        self._initialized = True

        self._seed_data()

    def _seed_data(self):
        """Додавання початкових даних для UI."""
        sample_task_id = "task-888-sovereign"
        if sample_task_id not in self.tasks:
            self.tasks[sample_task_id] = AntigravityTask(
                task_id=sample_task_id,
                description="Аудит цілісності WORM-таблиць та верифікація тригерів PostgreSQL",
                status=TaskStatus.COMPLETED,
                progress=100,
                actual_cost_usd=2.15,
                finished_at=datetime.now(UTC)
            )

    async def start(self, app: "FastAPI" = None):
        """Запуск фонового циклу оркестрації."""
        if app:
            self.app = app

        if self._loop_task is None or self._loop_task.done():
            self.status.is_running = True
            self.status.orchestrator_status = "online"
            self._loop_task = asyncio.create_task(self._orchestrator_loop())
            logger.info("Antigravity AGI Orchestrator loop started.")

    async def sync_with_factory(self, app: "FastAPI"):
        """Синхронізація логів оркестратора з головним журналом вдосконалення системи."""
        repo = getattr(app.state, "factory_repo", None)
        if not repo:
            return

        try:
            status = await repo.get_improvement()
            if status.is_running:
                # Додаємо останні важливі події з логів оркестратора в SystemImprovement logs
                for log in self.logs[:5]:  # Тільки останні 5
                    msg = f"[{log.timestamp.strftime('%H:%M:%S')}] 🤖 AGENT({log.agent_type or 'SYSTEM'}): {log.message}"
                    if msg not in status.logs:
                        status.logs.append(msg)

                status.last_update = datetime.now(UTC)
                await repo.update_improvement(status)
        except Exception as e:
            logger.error(f"Failed to sync with factory: {e}")

    async def _orchestrator_loop(self):
        """Головний цикл перевірки черги задач та призначення агентів."""
        while self.status.is_running:
            try:
                # 1. Пошук очікуючих задач
                pending_tasks = [t for t in self.tasks.values() if t.status == TaskStatus.PENDING]

                for task in pending_tasks:
                    # 2. Пошук вільного агента
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

                # 5. Синхронізація з фабрикою (якщо є доступ до app)
                # app передається через start(), але ми збережемо його в self
                if hasattr(self, 'app'):
                    await self.sync_with_factory(self.app)

            except Exception as e:
                logger.error(f"Error in orchestrator loop: {e}")

            await asyncio.sleep(5)

    async def _assign_task(self, task: AntigravityTask, agent: AgentStatus):
        """Призначення задачі агенту."""
        task.status = TaskStatus.RUNNING
        task.assigned_agent = agent.type
        task.started_at = datetime.now(UTC)
        agent.is_busy = True
        agent.current_task_id = task.task_id

        self.add_log(task.task_id, f"Агент {agent.name} розпочав виконання завдання: {task.description[:50]}...", agent.type)
        logger.info(f"Task {task.task_id} assigned to {agent.name}")

        await audit_logger.log(
            action="agi_task_assigned",
            resource_type="antigravity_task",
            resource_id=task.task_id,
            details={
                "agent_name": agent.name,
                "agent_type": agent.type,
                "task_description": task.description
            }
        )

    async def _simulate_progress(self, task: AntigravityTask):
        """Емуляція виконання задачі з елементами реального аналізу."""
        # Для SURGEON використовуємо реальний AI-аналіз через Gemini, якщо доступно
        if task.assigned_agent == AgentType.SURGEON and task.progress < 20:
            self.add_log(task.task_id, "Аналіз кодової бази через Gemini Code Context...", task.assigned_agent)
            try:
                # Спроба виклику ai_service для аналізу
                from app.services.ai_service import ai_service
                analysis = await ai_service.analyze_query(f"Identify potential issues for: {task.description}", provider="google")
                if analysis:
                    task.result_artifact = analysis.get("analysis", "Аналіз завершено.")
                    self.add_log(task.task_id, "Контекст проаналізовано успішно.", task.assigned_agent, level="success")
                    task.progress += 30
            except Exception:
                task.progress += 10 # Fallback

        # RED_TEAMER: Пошук лазівок через Adversarial Analysis
        if task.assigned_agent == AgentType.RED_TEAMER and task.progress < 30:
            self.add_log(task.task_id, "Запуск Adversarial Simulation для пошуку лазівок...", task.assigned_agent)
            try:
                from app.services.gemini_agent_service import gemini_service
                analysis = await gemini_service.generate(
                    prompt=f"Проаналізуй наступний сценарій/код на предмет митних лазівок та можливостей для фроду: {task.description}",
                    system_instruction="Ти — Adversarial AI. Твоя мета — знайти слабкі місця в системі митного контролю."
                )
                if analysis.get("content"):
                    task.result_artifact = f"Знайдені вразливості: {analysis['content'][:500]}..."
                    self.add_log(task.task_id, "Вразливості ідентифіковано.", task.assigned_agent, level="warn")
                    task.progress += 40
            except Exception as e:
                logger.error(f"Red Team analysis failed: {e}")
                task.progress += 15

        # Випадковий прогрес 5-20%
        import random
        inc = random.randint(5, 20)
        task.progress += inc
        task.actual_cost_usd += 0.05
        self.status.total_spent_usd += 0.05

        if task.progress >= 100:
            task.progress = 100
            task.status = TaskStatus.COMPLETED
            task.finished_at = datetime.now(UTC)

            agent = next((a for a in self.status.agents if a.type == task.assigned_agent), None)
            if agent:
                agent.is_busy = False
                agent.current_task_id = None
                agent.tasks_completed += 1
                self.add_log(task.task_id, f"Завдання {task.task_id} успішно завершено.", agent.type, level="success")

                await audit_logger.log(
                    action="agi_task_completed",
                    resource_type="antigravity_task",
                    resource_id=task.task_id,
                    details={
                        "agent_name": agent.name,
                        "cost_usd": task.actual_cost_usd,
                        "artifact": task.result_artifact[:200] if task.result_artifact else None
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
            max_budget_usd=max_budget or 10.0,
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

orchestrator = AntigravityOrchestrator()
