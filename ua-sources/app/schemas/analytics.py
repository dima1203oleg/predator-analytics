"""Analytics Schemas"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    MINIMAL = "MINIMAL"  # Мінімальний ризик
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class LLMMode(str, Enum):
    AUTO = "auto"          # Smart routing based on complexity
    FAST = "fast"          # Force fast model (Groq/Mistral)
    PRECISE = "precise"    # Force smart model (GPT-4/Claude)
    COUNCIL = "council"    # Multi-model consensus


class AnalyticsQuery(BaseModel):
    query: str
    sectors: List[str] = ["GOV", "BIZ"]
    depth: str = "standard"
    llm_mode: LLMMode = LLMMode.AUTO
    preferred_provider: Optional[str] = None


class RiskAssessment(BaseModel):
    entity: str
    risk_level: RiskLevel
    score: float
    factors: List[str]
    recommendations: List[str]


class TrendData(BaseModel):
    date: str
    value: float
    change: float
