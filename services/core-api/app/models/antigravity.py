"""PREDATOR Antigravity AGI Models
Моделі даних для автономної архітектури розробки ПЗ (v1.0-ELITE)
"""

from datetime import datetime, UTC
from enum import Enum
from pydantic import BaseModel, Field


class AgentType(str, Enum):
    """Типи спеціалізованих агентів"""
    ARCHITECT = "architect"
    SURGEON = "surgeon"
    QA_BROWSER = "qa_browser"
    QA_DEVTOOLS = "qa_devtools"
    FINANCIAL_ANALYST = "financial_analyst"
    OSINT_EXPERT = "osint_expert"


class AgentTechnology(str, Enum):
    """Технологічний стек агентів"""
    OPENHANDS = "OpenHands"
    AIDER = "Aider"
    CHROME_CDP = "Chrome CDP"
    PLAYWRIGHT = "Playwright"


class TaskStatus(str, Enum):
    """Статуси AGI-задач"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Пріоритет виконання"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AgentStatus(BaseModel):
    """Стан конкретного агента в матриці"""
    type: AgentType
    name: str
    technology: AgentTechnology | str
    specialization: str = "General Purpose Intelligence"
    is_busy: bool = False
    current_task_id: str | None = None
    tasks_completed: int = 0
    errors_count: int = 0
    last_active: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AntigravityOrchestratorStatus(BaseModel):
    """Загальний стан системи Antigravity Coder (WRAITH-Stabilized)"""
    is_running: bool = False
    active_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    total_spent_usd: float = 0.0
    budget_limit_usd: float = 100.0
    llm_gateway_status: str = "offline"  # online, offline, degraded
    sandbox_status: str = "offline"      # online, offline, initializing
    agents: list[AgentStatus] = Field(default_factory=list)
    active_model: str | None = None
    last_update: str | None = None
    orchestrator_status: str = "idle"    # online, offline, idle


class AntigravityTaskCreate(BaseModel):
    """Схема створення нової задачі"""
    description: str = Field(..., min_length=10, max_length=1000)
    priority: TaskPriority = TaskPriority.MEDIUM
    max_budget_usd: float | None = Field(default=None, ge=0.1)


class AntigravityTask(BaseModel):
    """Повна модель AGI-задачі"""
    task_id: str
    description: str
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    assigned_agent: AgentType | None = None
    progress: int = Field(default=0, ge=0, le=100)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    started_at: datetime | None = None
    finished_at: datetime | None = None
    max_budget_usd: float | None = None
    actual_cost_usd: float = 0.0
    result_artifact: str | None = None


class AntigravityTaskLog(BaseModel):
    """Рядок логу виконання задачі"""
    task_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    level: str = "info"  # info, warn, error, success
    message: str
    agent_type: AgentType | None = None
