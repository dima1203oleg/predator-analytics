"""
PREDATOR Factory Core Models
Модель даних для Knowledge Map та Pattern Management
"""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List, Dict, Literal
import hashlib
import json
from enum import Enum


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
    changes: Dict = Field(default_factory=dict, description="JSON опис змін")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    branch: Optional[str] = "main"
    commit_sha: Optional[str] = None

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
    id: Optional[str] = None  # UUID для БД
    component: ComponentType
    pattern_description: str = Field(..., min_length=10, max_length=500)
    pattern_type: PatternType = PatternType.OTHER
    score: float = Field(..., ge=0, le=100)
    gold: bool = Field(default=False, description="Чи це Gold Pattern (score >= 92)?")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    hash: str = Field(..., min_length=64, max_length=64)
    tags: List[str] = Field(default_factory=list)
    source_run_id: str
    metrics_snapshot: Optional[Metrics] = None
    recommendation: Optional[str] = None


class Report(BaseModel):
    """Звіт за risultato пайплайну"""
    run_id: str
    score: float
    summary: str  # локалізований
    patterns_found: int
    recommendations: List[str] = Field(default_factory=list)
    metrics: Metrics
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class FactoryStats(BaseModel):
    """Статистика Factory"""
    total_runs: int = 0
    total_patterns: int = 0
    gold_patterns: int = 0
    avg_score: float = 0.0
    components_analyzed: Dict[str, int] = Field(default_factory=dict)
    last_run: Optional[datetime] = None
