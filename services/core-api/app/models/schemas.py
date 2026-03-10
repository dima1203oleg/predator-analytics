from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# --- Enums (v55.2 SM-EXTENDED) ---

class RiskLevel(str, Enum):
    STABLE = "stable"        # 0..20
    WATCHLIST = "watchlist"  # 21..40
    ELEVATED = "elevated"    # 41..60
    HIGH_ALERT = "high"      # 61..80
    CRITICAL = "critical"    # 81..100

class EntityStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    LIQUIDATED = "liquidated"
    SANCTIONED = "sanctioned"

# --- Common Components ---

class ComponentDetail(BaseModel):
    value: float = Field(..., description="Бал компоненту (0-100)")
    weight: float = Field(..., description="Вага")

class CersComponents(BaseModel):
    behavioral: ComponentDetail
    institutional: ComponentDetail
    influence: ComponentDetail
    structural: ComponentDetail
    predictive: ComponentDetail

class Uncertainty(BaseModel):
    lower: float
    upper: float

# --- Entity Responses ---

class CompanyResponse(BaseModel):
    ueid: str = Field(..., description="Унікальний ідентифікатор компанії")
    name: str = Field(..., description="Назва компанії")
    edrpou: Optional[str] = Field(None, description="ЄДРПОУ")
    status: EntityStatus
    sector: Optional[str] = None
    risk_level: RiskLevel
    risk_score: float = Field(..., description="Композитний балл CERS")
    cers_confidence: float = Field(..., description="Впевненість у розрахунку (0-1)")
    
    # Деталізація ризику (опціонально для списків, обов'язково для профілю)
    risk_details: Optional[CersComponents] = None
    interpretation: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PersonResponse(BaseModel):
    ueid: str
    full_name: str
    inn: Optional[str] = None
    status: EntityStatus
    risk_level: RiskLevel
    risk_score: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Search & Lists ---

class SearchMeta(BaseModel):
    total: int
    limit: int
    offset: int
    has_next: bool
    execution_time_ms: int

class PaginatedCompanyResponse(BaseModel):
    data: List[CompanyResponse]
    meta: SearchMeta

# --- Customs (aligned with declarations.py) ---

class DeclarationResponse(BaseModel):
    declaration_id: str
    declaration_number: str
    declaration_date: date
    importer_ueid: Optional[str]
    importer_name: Optional[str]
    hs_code: str
    product_name_uk: Optional[str]
    customs_value_usd: float
    origin_country: Optional[str]
    risk_score: float

    model_config = ConfigDict(from_attributes=True)
