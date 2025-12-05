"""Analytics Schemas"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AnalyticsQuery(BaseModel):
    query: str
    sectors: List[str] = ["GOV", "BIZ"]
    depth: str = "standard"


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
