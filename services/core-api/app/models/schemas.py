from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

# --- Enums (v55.2 SM-EXTENDED) ---

class RiskLevel(StrEnum):
    STABLE = "stable"        # 0..20
    WATCHLIST = "watchlist"  # 21..40
    ELEVATED = "elevated"    # 41..60
    HIGH_ALERT = "high"      # 61..80
    CRITICAL = "critical"    # 81..100

class EntityStatus(StrEnum):
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
    edrpou: str | None = Field(None, description="ЄДРПОУ")
    status: EntityStatus
    sector: str | None = None
    risk_level: RiskLevel
    risk_score: float = Field(..., description="Композитний балл CERS")
    cers_confidence: float = Field(..., description="Впевненість у розрахунку (0-1)")

    # Деталізація ризику (опціонально для списків, обов'язково для профілю)
    risk_details: CersComponents | None = None
    interpretation: str | None = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PersonResponse(BaseModel):
    ueid: str
    full_name: str
    inn: str | None = None
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
    data: list[CompanyResponse]
    meta: SearchMeta

# --- Customs (aligned with declarations.py) ---

class DeclarationResponse(BaseModel):
    declaration_id: str
    declaration_number: str
    declaration_date: date
    importer_ueid: str | None
    importer_name: str | None
    hs_code: str
    product_name_uk: str | None
    customs_value_usd: float
    origin_country: str | None
    risk_score: float

    model_config = ConfigDict(from_attributes=True)
