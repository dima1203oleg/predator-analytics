"""
🎯 Mission Planner - Централізований планувальник місій для AI агентів

Реалізує OODA Loop (Observe → Orient → Decide → Act) для координації
22+ спеціалізованих агентів та виконання складних мультиагентних задач.
"""

import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
from pydantic import BaseModel
from libs.core.structured_logger import get_logger, log_business_event, RequestLogger

logger = get_logger("services.orchestrator.mission_planner")


class MissionPriority(str, Enum):
    """Пріоритет місії"""
    CRITICAL = "critical"  # Критична - негайне виконання
    HIGH = "high"          # Висока
    MEDIUM = "medium"      # Середня
    LOW = "low"            # Низька
    BACKGROUND = "background"  # Фонова


class MissionStatus(str, Enum):
    """Статус виконання місії"""
    PENDING = "pending"          # Очікує
    PLANNING = "planning"        # Планування
    IN_PROGRESS = "in_progress"  # Виконується
    COMPLETED = "completed"      # Завершено
    FAILED = "failed"            # Провалено
    CANCELLED = "cancelled"      # Скасовано


class AgentType(str, Enum):
    """Типи агентів в екосистемі"""
    SIGINT = "sigint"          # Signals Intelligence
    HUMINT = "humint"          # Human Intelligence
    TECHINT = "techint"        # Technical Intelligence
    CYBINT = "cybint"          # Cyber Intelligence
    OSINT = "osint"            # Open Source Intelligence
    SUPERVISOR = "supervisor"  # Supervisor Agent
    LLM = "llm"                # LLM Reasoning Agent
    CRITIC = "critic"          # Quality Critic
    REFINER = "refiner"        # Result Refiner
    EXECUTOR = "executor"      # Action Executor
    DEVOPS = "devops"          # DevOps Automation
    SECURITY = "security"      # Security Scanner
    FRONTEND = "frontend"      # Frontend Improver
    PERFORMANCE = "performance"  # Performance Monitor
    SELF_HEALING = "self_healing"  # Self-Healing Agent


@dataclass
class AgentCapability:
    """Можливості агента"""
    agent_type: AgentType
    skills: List[str]
    max_concurrent_tasks: int = 3
    avg_response_time_ms: float = 1000.0
    success_rate: float = 0.95
    current_load: int = 0


@dataclass
class MissionTask:
    """Окрема задача в місії"""
    task_id: str
    description: str
    assigned_agent: Optional[AgentType] = None
    status: str = "pending"
    result: Optional[Any] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


@dataclass
class Mission:
    """Місія для виконання"""
    mission_id: str
    title: str
    description: str
    priority: MissionPriority
    status: MissionStatus = MissionStatus.PENDING
    tasks: List[MissionTask] = field(default_factory=list)
    assigned_agents: List[AgentType] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)
    ooda_metrics: Dict[str, float] = field(default_factory=dict)  # {observe_ms: 0, orient_ms: 0, decide_ms: 0, act_ms: 0}
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None


class MissionPlanner:
    """
    Централізований планувальник місій для мультиагентної системи.

    Основні функції:
    1. OBSERVE - Збір контексту та аналіз задачі
    2. ORIENT - Оцінка ситуації та доступних ресурсів
    3. DECIDE - Вибір стратегії та агентів
    4. ACT - Виконання плану та координація
    """

    def __init__(self):
        self.active_missions: Dict[str, Mission] = {}
        self.completed_missions: List[Mission] = []
        self.agent_registry: Dict[AgentType, AgentCapability] = {}
        self._initialize_agent_registry()

    def _initialize_agent_registry(self):
        """Реєстрація всіх доступних агентів"""
        # Intelligence Agents
        self.agent_registry[AgentType.SIGINT] = AgentCapability(
            agent_type=AgentType.SIGINT,
            skills=["network_analysis", "signal_interception", "traffic_monitoring"],
            max_concurrent_tasks=5
        )

        self.agent_registry[AgentType.HUMINT] = AgentCapability(
            agent_type=AgentType.HUMINT,
            skills=["social_engineering", "behavior_analysis", "threat_profiling"],
            max_concurrent_tasks=3
        )

        self.agent_registry[AgentType.TECHINT] = AgentCapability(
            agent_type=AgentType.TECHINT,
            skills=["vulnerability_scan", "technical_audit", "system_analysis"],
            max_concurrent_tasks=4
        )

        self.agent_registry[AgentType.CYBINT] = AgentCapability(
            agent_type=AgentType.CYBINT,
            skills=["threat_hunting", "ioc_correlation", "apt_tracking"],
            max_concurrent_tasks=5
        )

        self.agent_registry[AgentType.OSINT] = AgentCapability(
            agent_type=AgentType.OSINT,
            skills=["dark_web_monitoring", "osint_collection", "data_aggregation"],
            max_concurrent_tasks=6
        )

        # Processing Agents
        self.agent_registry[AgentType.SUPERVISOR] = AgentCapability(
            agent_type=AgentType.SUPERVISOR,
            skills=["task_coordination", "resource_allocation", "decision_making"],
            max_concurrent_tasks=10
        )

        self.agent_registry[AgentType.LLM] = AgentCapability(
            agent_type=AgentType.LLM,
            skills=["reasoning", "synthesis", "xai_explanation"],
            max_concurrent_tasks=3,
            avg_response_time_ms=2000.0
        )

        self.agent_registry[AgentType.CRITIC] = AgentCapability(
            agent_type=AgentType.CRITIC,
            skills=["quality_validation", "fact_checking", "bias_detection"],
            max_concurrent_tasks=5
        )

        self.agent_registry[AgentType.REFINER] = AgentCapability(
            agent_type=AgentType.REFINER,
            skills=["result_enhancement", "iterative_improvement", "optimization"],
            max_concurrent_tasks=4
        )

        # Operations Agents
        self.agent_registry[AgentType.DEVOPS] = AgentCapability(
            agent_type=AgentType.DEVOPS,
            skills=["deployment", "infrastructure", "ci_cd"],
            max_concurrent_tasks=3
        )

        self.agent_registry[AgentType.SECURITY] = AgentCapability(
            agent_type=AgentType.SECURITY,
            skills=["security_scan", "compliance_check", "vulnerability_assessment"],
            max_concurrent_tasks=4
        )

        self.agent_registry[AgentType.SELF_HEALING] = AgentCapability(
            agent_type=AgentType.SELF_HEALING,
            skills=["auto_recovery", "health_check", "remediation"],
            max_concurrent_tasks=5
        )

        logger.info("agents_registered", count=len(self.agent_registry))

    async def create_mission(
        self,
        title: str,
        description: str,
        priority: MissionPriority = MissionPriority.MEDIUM,
        context: Optional[Dict[str, Any]] = None
    ) -> Mission:
        """Створити нову місію"""
        mission_id = f"mission_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"

        mission = Mission(
            mission_id=mission_id,
            title=title,
            description=description,
            priority=priority,
            context=context or {}
        )

        self.active_missions[mission_id] = mission
        logger.info("mission_created", title=mission.title, mission_id=mission_id)

        log_business_event(
            logger,
            "mission_lifecycle_created",
            mission_id=mission_id,
            priority=priority.value,
            title=title
        )

        return mission

    async def plan_mission(self, mission: Mission) -> Mission:
        """
        OODA Loop: Планування місії

        1. OBSERVE - Аналіз вхідних даних
        2. ORIENT - Оцінка доступних агентів
        3. DECIDE - Розбиття на задачі та призначення агентів
        4. ACT - Початок виконання
        """
        async with RequestLogger(logger, "mission_planning", mission_id=mission.mission_id):
            mission.status = MissionStatus.PLANNING
            start_planning = datetime.now()

            # 1. OBSERVE - Збір контексту
            obs_start = datetime.now()
            async with RequestLogger(logger, "ooda_observe", mission_id=mission.mission_id):
                context = await self._observe_context(mission)
            mission.ooda_metrics["observe_ms"] = (datetime.now() - obs_start).total_seconds() * 1000

            # 2. ORIENT - Аналіз ресурсів
            ori_start = datetime.now()
            async with RequestLogger(logger, "ooda_orient", mission_id=mission.mission_id):
                available_agents = await self._orient_resources(mission)
            mission.ooda_metrics["orient_ms"] = (datetime.now() - ori_start).total_seconds() * 1000

            # 3. DECIDE - Створення плану
            dec_start = datetime.now()
            async with RequestLogger(logger, "ooda_decide", mission_id=mission.mission_id):
                tasks = await self._decide_strategy(mission, context, available_agents)
                mission.tasks = tasks
            mission.ooda_metrics["decide_ms"] = (datetime.now() - dec_start).total_seconds() * 1000

            # 4. Призначення агентів
            for task in tasks:
                agent = await self._assign_best_agent(task, available_agents)
                if agent:
                    task.assigned_agent = agent
                    mission.assigned_agents.append(agent)

            log_business_event(
                logger,
                "mission_plan_ready",
                mission_id=mission.mission_id,
                tasks_count=len(tasks),
                agents_count=len(set(mission.assigned_agents)),
                ooda_metrics=mission.ooda_metrics
            )

            return mission

    async def _observe_context(self, mission: Mission) -> Dict[str, Any]:
        """OBSERVE: Збір та аналіз контексту"""
        context = {
            "mission_type": self._classify_mission_type(mission),
            "complexity": self._estimate_complexity(mission),
            "required_skills": self._extract_required_skills(mission),
            "time_constraint": mission.context.get("deadline"),
            "resources": mission.context.get("resources", {})
        }

        logger.debug(
            "observe_context",
            mission_type=context['mission_type'],
            complexity=context['complexity']
        )
        return context

    async def _orient_resources(self, mission: Mission) -> List[AgentType]:
        """ORIENT: Оцінка доступних агентів"""
        available = []

        for agent_type, capability in self.agent_registry.items():
            if capability.current_load < capability.max_concurrent_tasks:
                available.append(agent_type)

        # Сортування за пріоритетом для цієї місії
        if mission.priority == MissionPriority.CRITICAL:
            # Для критичних - всі доступні
            return available

        return available[:10]  # Обмеження для звичайних місій

    async def _decide_strategy(
        self,
        mission: Mission,
        context: Dict[str, Any],
        available_agents: List[AgentType]
    ) -> List[MissionTask]:
        """DECIDE: Створення стратегії виконання"""
        tasks = []
        mission_type = context["mission_type"]

        # Базовані на типі місії створюємо задачі
        if mission_type == "threat_analysis":
            tasks = await self._create_threat_analysis_tasks(mission)
        elif mission_type == "data_processing":
            tasks = await self._create_data_processing_tasks(mission)
        elif mission_type == "system_health":
            tasks = await self._create_health_check_tasks(mission)
        elif mission_type == "deployment":
            tasks = await self._create_deployment_tasks(mission)
        else:
            # Загальна стратегія
            tasks = await self._create_generic_tasks(mission)

        return tasks

    async def _create_threat_analysis_tasks(self, mission: Mission) -> List[MissionTask]:
        """Задачі для аналізу загроз"""
        return [
            MissionTask(
                task_id=f"{mission.mission_id}_sigint",
                description="Аналіз мережевого трафіку та сигналів"
            ),
            MissionTask(
                task_id=f"{mission.mission_id}_cybint",
                description="Пошук індикаторів компрометації"
            ),
            MissionTask(
                task_id=f"{mission.mission_id}_osint",
                description="Збір розвідданих з відкритих джерел"
            ),
            MissionTask(
                task_id=f"{mission.mission_id}_llm",
                description="Синтез та формування висновків"
            )
        ]

    async def _create_data_processing_tasks(self, mission: Mission) -> List[MissionTask]:
        """Задачі для обробки даних"""
        return [
            MissionTask(
                task_id=f"{mission.mission_id}_validate",
                description="Валідація вхідних даних"
            ),
            MissionTask(
                task_id=f"{mission.mission_id}_process",
                description="Обробка та трансформація"
            ),
            MissionTask(
                task_id=f"{mission.mission_id}_quality",
                description="Контроль якості результатів"
            )
        ]

    async def _create_health_check_tasks(self, mission: Mission) -> List[MissionTask]:
        """Задачі для перевірки здоров'я системи"""
        return [
            MissionTask(
                task_id=f"{mission.mission_id}_performance",
                description="Аналіз продуктивності"
            ),
            MissionTask(
                task_id=f"{mission.mission_id}_security",
                description="Сканування безпеки"
            ),
            MissionTask(
                task_id=f"{mission.mission_id}_healing",
                description="Автоматичне виправлення проблем"
            )
        ]

    async def _create_deployment_tasks(self, mission: Mission) -> List[MissionTask]:
        """Задачі для deployment"""
        return [
            MissionTask(
                task_id=f"{mission.mission_id}_test",
                description="Запуск тестів"
            ),
            MissionTask(
                task_id=f"{mission.mission_id}_deploy",
                description="Розгортання на сервері"
            ),
            MissionTask(
                task_id=f"{mission.mission_id}_verify",
                description="Верифікація deployment"
            )
        ]

    async def _create_generic_tasks(self, mission: Mission) -> List[MissionTask]:
        """Загальні задачі"""
        return [
            MissionTask(
                task_id=f"{mission.mission_id}_analyze",
                description=f"Аналіз: {mission.description}"
            ),
            MissionTask(
                task_id=f"{mission.mission_id}_execute",
                description="Виконання основної задачі"
            ),
            MissionTask(
                task_id=f"{mission.mission_id}_validate",
                description="Валідація результатів"
            )
        ]

    async def _assign_best_agent(
        self,
        task: MissionTask,
        available_agents: List[AgentType]
    ) -> Optional[AgentType]:
        """Призначити найкращого агента для задачі"""
        # Простий алгоритм: вибираємо за ключовими словами
        task_lower = task.description.lower()

        # Пріоритети для різних типів задач
        if "мереж" in task_lower or "трафік" in task_lower or "signal" in task_lower:
            return AgentType.SIGINT if AgentType.SIGINT in available_agents else None

        if "cyber" in task_lower or "іoc" in task_lower or "threat" in task_lower:
            return AgentType.CYBINT if AgentType.CYBINT in available_agents else None

        if "osint" in task_lower or "розвід" in task_lower:
            return AgentType.OSINT if AgentType.OSINT in available_agents else None

        if "синтез" in task_lower or "висновк" in task_lower or "llm" in task_lower:
            return AgentType.LLM if AgentType.LLM in available_agents else None

        if "якість" in task_lower or "валідація" in task_lower or "quality" in task_lower:
            return AgentType.CRITIC if AgentType.CRITIC in available_agents else None

        if "deploy" in task_lower or "розгортання" in task_lower:
            return AgentType.DEVOPS if AgentType.DEVOPS in available_agents else None

        if "security" in task_lower or "безпека" in task_lower or "скануван" in task_lower:
            return AgentType.SECURITY if AgentType.SECURITY in available_agents else None

        if "healing" in task_lower or "відновлення" in task_lower or "виправлення" in task_lower:
            return AgentType.SELF_HEALING if AgentType.SELF_HEALING in available_agents else None

        if "performance" in task_lower or "продуктивність" in task_lower:
            return AgentType.PERFORMANCE if AgentType.PERFORMANCE in available_agents else None

        # За замовчуванням - Supervisor
        return AgentType.SUPERVISOR if AgentType.SUPERVISOR in available_agents else None

    async def execute_mission(self, mission: Mission) -> Mission:
        """ACT: Виконання місії"""
        mission.status = MissionStatus.IN_PROGRESS
        mission.started_at = datetime.now()

        async with RequestLogger(logger, "mission_execution", mission_id=mission.mission_id):
            act_start = datetime.now()
            try:
                # Виконуємо задачі паралельно або послідовно залежно від залежностей
                results = await asyncio.gather(
                    *[self._execute_task(task) for task in mission.tasks],
                    return_exceptions=True
                )
                mission.ooda_metrics["act_ms"] = (datetime.now() - act_start).total_seconds() * 1000

                # Перевірка результатів
                failed_tasks = [
                    task for task in mission.tasks
                    if task.status == "failed"
                ]

                if failed_tasks:
                    mission.status = MissionStatus.FAILED
                    mission.result = {
                        "success": False,
                        "failed_tasks": len(failed_tasks),
                        "errors": [task.error for task in failed_tasks]
                    }
                else:
                    mission.status = MissionStatus.COMPLETED
                    mission.result = {
                        "success": True,
                        "completed_tasks": len(mission.tasks),
                        "results": [task.result for task in mission.tasks]
                    }

                mission.completed_at = datetime.now()
                duration = (mission.completed_at - mission.started_at).total_seconds()

                log_business_event(
                    logger,
                    "mission_lifecycle_completed",
                    mission_id=mission.mission_id,
                    status=mission.status.value,
                    duration_s=duration,
                    tasks_total=len(mission.tasks),
                    tasks_failed=len(failed_tasks) if 'failed_tasks' in locals() else 0
                )

            except Exception as e:
                mission.status = MissionStatus.FAILED
                mission.result = {"success": False, "error": str(e)}
                logger.exception("mission_execution_failed", error=str(e), mission_id=mission.mission_id)

        # Переміщуємо в завершені
        if mission.mission_id in self.active_missions:
            del self.active_missions[mission.mission_id]
        self.completed_missions.append(mission)

        return mission

    async def _execute_task(self, task: MissionTask) -> Any:
        """Виконати окрему задачу"""
        task.status = "in_progress"
        task.started_at = datetime.now()

        try:
            # Тут буде реальний виклик агента
            # Поки що - симуляція
            await asyncio.sleep(0.5)  # Симуляція роботи

            task.result = {
                "status": "success",
                "agent": task.assigned_agent.value if task.assigned_agent else "none",
                "data": f"Result from {task.description}"
            }
            task.status = "completed"

        except Exception as e:
            task.status = "failed"
            task.error = str(e)
            logger.error(
                "task_failed",
                task_id=task.task_id,
                error=str(e),
                description=task.description
            )

        finally:
            task.completed_at = datetime.now()

        return task.result

    def _classify_mission_type(self, mission: Mission) -> str:
        """Класифікувати тип місії"""
        desc_lower = mission.description.lower()

        if any(word in desc_lower for word in ["threat", "загроза", "атака", "attack"]):
            return "threat_analysis"
        elif any(word in desc_lower for word in ["data", "дані", "process", "обробка"]):
            return "data_processing"
        elif any(word in desc_lower for word in ["health", "здоров'я", "monitor", "моніторинг"]):
            return "system_health"
        elif any(word in desc_lower for word in ["deploy", "розгортання", "release"]):
            return "deployment"
        else:
            return "generic"

    def _estimate_complexity(self, mission: Mission) -> str:
        """Оцінити складність місії"""
        # Проста евристика
        desc_len = len(mission.description)

        if mission.priority == MissionPriority.CRITICAL:
            return "high"
        elif desc_len > 200:
            return "high"
        elif desc_len > 100:
            return "medium"
        else:
            return "low"

    def _extract_required_skills(self, mission: Mission) -> List[str]:
        """Визначити необхідні навички"""
        skills = []
        desc_lower = mission.description.lower()

        skill_keywords = {
            "network_analysis": ["network", "мережа", "трафік", "traffic"],
            "threat_hunting": ["threat", "загроза", "hunt"],
            "data_processing": ["data", "дані", "process"],
            "security_scan": ["security", "безпека", "scan"],
            "deployment": ["deploy", "розгортання"],
        }

        for skill, keywords in skill_keywords.items():
            if any(kw in desc_lower for kw in keywords):
                skills.append(skill)

        return skills or ["general"]

    def get_mission_status(self, mission_id: str) -> Optional[Dict[str, Any]]:
        """Отримати статус місії"""
        if mission_id in self.active_missions:
            mission = self.active_missions[mission_id]
        else:
            mission = next(
                (m for m in self.completed_missions if m.mission_id == mission_id),
                None
            )

        if not mission:
            return None

        return {
            "mission_id": mission.mission_id,
            "title": mission.title,
            "status": mission.status.value,
            "priority": mission.priority.value,
            "progress": self._calculate_progress(mission),
            "tasks": [
                {
                    "task_id": task.task_id,
                    "description": task.description,
                    "agent": task.assigned_agent.value if task.assigned_agent else None,
                    "status": task.status
                }
                for task in mission.tasks
            ],
            "created_at": mission.created_at.isoformat(),
            "started_at": mission.started_at.isoformat() if mission.started_at else None,
            "completed_at": mission.completed_at.isoformat() if mission.completed_at else None,
            "ooda_metrics": mission.ooda_metrics
        }

    def _calculate_progress(self, mission: Mission) -> float:
        """Розрахувати прогрес виконання"""
        if not mission.tasks:
            return 0.0

        completed = sum(1 for task in mission.tasks if task.status == "completed")
        return (completed / len(mission.tasks)) * 100.0

    def get_agent_stats(self) -> Dict[str, Any]:
        """Статистика по агентам"""
        stats = {}

        for agent_type, capability in self.agent_registry.items():
            stats[agent_type.value] = {
                "skills": capability.skills,
                "max_concurrent": capability.max_concurrent_tasks,
                "current_load": capability.current_load,
                "availability": capability.current_load < capability.max_concurrent_tasks,
                "success_rate": capability.success_rate,
                "avg_response_time_ms": capability.avg_response_time_ms
            }

        return stats


# Singleton instance
_mission_planner = None

def get_mission_planner() -> MissionPlanner:
    """Отримати глобальний екземпляр Mission Planner"""
    global _mission_planner
    if _mission_planner is None:
        _mission_planner = MissionPlanner()
    return _mission_planner
