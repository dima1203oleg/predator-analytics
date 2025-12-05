"""
UA Sources - Pydantic Schemas
Request/Response models for API endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# === Enums ===

class RiskLevel(str, Enum):
    MINIMAL = "MINIMAL"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DataSourceType(str, Enum):
    PROZORRO = "prozorro"
    EDR = "edr"
    TAX = "tax"
    CUSTOMS = "customs"
    NBU = "nbu"
    COURT = "court"


# === Company Schemas ===

class CompanyBase(BaseModel):
    edrpou: str = Field(..., min_length=8, max_length=10)
    name: str


class CompanyCreate(CompanyBase):
    short_name: Optional[str] = None
    address: Optional[str] = None
    kved: Optional[str] = None


class CompanyResponse(CompanyBase):
    id: int
    status: Optional[str] = None
    registration_date: Optional[datetime] = None
    address: Optional[str] = None
    kved: Optional[str] = None
    kved_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# === Search Schemas ===

class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    sources: List[DataSourceType] = Field(default=[DataSourceType.EDR])
    limit: int = Field(default=20, le=100)


class SearchResult(BaseModel):
    source: DataSourceType
    count: int
    data: List[Dict[str, Any]]
    search_time_ms: float


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_count: int
    timestamp: datetime


# === Risk Assessment Schemas ===

class RiskAssessmentRequest(BaseModel):
    edrpou: str
    include_history: bool = False


class RiskFactor(BaseModel):
    name: str
    score: float
    description: str


class RiskAssessmentResponse(BaseModel):
    edrpou: str
    company_name: Optional[str] = None
    risk_level: RiskLevel
    overall_score: float = Field(..., ge=0, le=1)
    factors: List[RiskFactor]
    recommendations: List[str]
    assessed_at: datetime


# === Tender Schemas ===

class TenderBase(BaseModel):
    tender_id: str
    title: str
    status: str


class TenderResponse(TenderBase):
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: str = "UAH"
    procuring_entity_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TenderSearchResponse(BaseModel):
    query: str
    count: int
    tenders: List[TenderResponse]


# === Exchange Rate Schemas ===

class ExchangeRateResponse(BaseModel):
    currency_code: str
    currency_name: str
    rate: float
    rate_date: datetime


class ExchangeRatesResponse(BaseModel):
    rates: List[ExchangeRateResponse]
    base_currency: str = "UAH"
    date: datetime


# === Analysis Schemas ===

class AnalysisRequest(BaseModel):
    query: str
    sectors: List[str] = Field(default=["GOV", "BIZ"])
    depth: str = Field(default="standard", pattern="^(quick|standard|deep)$")


class AnalysisSource(BaseModel):
    name: str
    type: str
    count: int
    data: List[Dict[str, Any]] = []


class AnalysisResponse(BaseModel):
    query: str
    answer: str
    sources: List[AnalysisSource]
    confidence: float
    model_used: str
    processing_time_ms: float
    timestamp: datetime


# === Health Check ===

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
