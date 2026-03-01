from __future__ import annotations


"""Analytics Schemas."""
from enum import StrEnum

from pydantic import BaseModel


class RiskLevel(StrEnum):
    MINIMAL = "MINIMAL"  # Мінімальний ризик
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class LLMMode(StrEnum):
    AUTO = "auto"  # Smart routing based on complexity
    FAST = "fast"  # Force fast model (Groq/Mistral)
    PRECISE = "precise"  # Force smart model (GPT-4/Claude)
    COUNCIL = "council"  # Multi-model consensus


class AnalyticsQuery(BaseModel):
    query: str
    sectors: list[str] = ["GOV", "BIZ"]
    depth: str = "standard"
    llm_mode: LLMMode = LLMMode.AUTO
    preferred_provider: str | None = None


class RiskAssessment(BaseModel):
    entity: str
    risk_level: RiskLevel
    score: float
    factors: list[str]
    recommendations: list[str]


class TrendData(BaseModel):
    date: str
    value: float
    change: float
