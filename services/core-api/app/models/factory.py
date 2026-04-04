"""PREDATOR Factory Core Models
Модель даних для Knowledge Map та Pattern Management
"""

from datetime import datetime
from enum import Enum
import hashlib
import json

from pydantic import BaseModel, Field, field_validator


class ComponentType(str, Enum):
    """Компоненти системи для аналізу"""

    WEB_UI = "web_ui"
    BACKEND = "backend"
    API = "api"
    ANALYTICS = "analytics"
    CORE = "core"


class PatternType(str, Enum):
    """Типи патернів"""

    PERFORMANCE = "performance"
    STABILITY = "stability"
    UX = "ux"
    SECURITY = "security"
    INTEGRATION = "integration"
    OTHER = "other"


class Metrics(BaseModel):
    """Метрики якості"""

    coverage: float = Field(..., ge=0, le=100, description="Покриття тестами %")
    pass_rate: float = Field(..., ge=0, le=100, description="Відсоток успішних тестів %")
    performance: float = Field(..., ge=0, le=100, description="Продуктивність %")
    chaos_resilience: float = Field(..., ge=0, le=100, description="Стійкість до збоїв %")
    business_kpi: float = Field(..., ge=0, le=100, description="Бізнес KPI %")

    @field_validator("*")
    @classmethod
    def validate_range(cls, v: float) -> float:
        """Перевірка, що всі метрики в межах [0, 100]"""
        if not (0 <= v <= 100):
            raise ValueError("Value must be between 0 and 100")
        return v

    def average(self) -> float:
        """Середня оцінка"""
        values = [self.coverage, self.pass_rate, self.performance,
                  self.chaos_resilience, self.business_kpi]
        return sum(values) / len(values)


class PipelineResult(BaseModel):
    """Результат виконання пайплайну (CI/CD)"""

    run_id: str = Field(..., min_length=1, max_length=100)
    component: ComponentType
    metrics: Metrics
    changes: dict = Field(default_factory=dict, description="JSON опис змін")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    branch: str | None = "main"
    commit_sha: str | None = None

    def compute_hash(self) -> str:
        """SHA256 хеш результату для детектування дублікатів"""
        data = json.dumps({
            "component": self.component.value,
            "metrics": self.metrics.model_dump(),
            "changes": self.changes,
        }, sort_keys=True)
        return hashlib.sha256(data.encode()).hexdigest()


class Pattern(BaseModel):
    """Виявлений успішний патерн"""

    id: str | None = None  # UUID для БД
    component: ComponentType
    pattern_description: str = Field(..., min_length=10, max_length=500)
    pattern_type: PatternType = PatternType.OTHER
    score: float = Field(..., ge=0, le=100)
    gold: bool = Field(default=False, description="Чи це Gold Pattern (score >= 92)?")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    hash: str = Field(..., min_length=64, max_length=64)
    tags: list[str] = Field(default_factory=list)
    source_run_id: str
    metrics_snapshot: Metrics | None = None
    recommendation: str | None = None


class Report(BaseModel):
    """Звіт за risultato пайплайну"""

    run_id: str
    score: float
    summary: str  # локалізований
    patterns_found: int
    recommendations: list[str] = Field(default_factory=list)
    metrics: Metrics
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class FactoryStats(BaseModel):
    """Статистика Factory"""

    total_runs: int = 0
    total_patterns: int = 0
    gold_patterns: int = 0
    avg_score: float = 0.0
    components_analyzed: dict[str, int] = Field(default_factory=dict)
    last_run: datetime | None = None


class BugSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class BugStatus(str, Enum):
    DETECTED = "detected"
    FIXING = "fixing"
    FIXED = "fixed"


class Bug(BaseModel):
    """Модель дефекту в системі"""

    id: str
    description: str
    severity: BugSeverity
    component: ComponentType
    file: str
    status: BugStatus = BugStatus.DETECTED
    fix_progress: int = 0
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    fixed_at: datetime | None = None


class ImprovementPhase(str, Enum):
    OBSERVE = "observe"
    ORIENT = "orient"
    DECIDE = "decide"
    ACT = "act"


class SystemImprovement(BaseModel):
    """Модель автономного вдосконалення"""

    is_running: bool = False
    current_phase: ImprovementPhase = ImprovementPhase.OBSERVE
    cycles_completed: int = 0
    improvements_made: int = 0
    logs: list[str] = Field(default_factory=list)
    last_update: datetime = Field(default_factory=datetime.utcnow)
