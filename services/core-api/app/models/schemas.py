from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Enums
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# CERS Scheme
class CersFactorResponse(BaseModel):
    name: str = Field(..., description="Назва фактору")
    contribution: float = Field(..., description="Внесок у загальний бал (0-100)")
    description: str = Field(..., description="Пояснення")

class CersScoreResponse(BaseModel):
    ueid: str = Field(..., description="Унікальний ідентифікатор")
    score: int = Field(..., description="Загальний бал (0-100)")
    level: RiskLevel = Field(..., description="Рівень ризику")
    factors: List[CersFactorResponse] = Field(default_factory=list)
    calculated_at: datetime = Field(default_factory=datetime.utcnow)
    explanation: str

# Entity Schemas
class CompanyResponse(BaseModel):
    ueid: str
    name: str
    edrpou: Optional[str] = None
    status: str
    risk_level: RiskLevel
    risk_score: int
    created_at: datetime
    updated_at: datetime

class PersonResponse(BaseModel):
    ueid: str
    full_name: str
    inn: Optional[str] = None
    risk_level: RiskLevel
    risk_score: int
    created_at: datetime
    updated_at: datetime
