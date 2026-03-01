from __future__ import annotations


"""UA Sources - Pydantic Schemas
Request/Response models for API endpoints.
"""
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# === Enums ===


class RiskLevel(StrEnum):
    MINIMAL = "MINIMAL"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DataSourceType(StrEnum):
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
    short_name: str | None = None
    address: str | None = None
    kved: str | None = None


class CompanyResponse(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str | None = None
    registration_date: datetime | None = None
    address: str | None = None
    kved: str | None = None
    kved_name: str | None = None
    created_at: datetime


# === Search Schemas ===


class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    sources: list[DataSourceType] = Field(default=[DataSourceType.EDR])
    limit: int = Field(default=20, le=100)


class SearchResult(BaseModel):
    source: DataSourceType
    count: int
    data: list[dict[str, Any]]
    search_time_ms: float


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
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
    company_name: str | None = None
    risk_level: RiskLevel
    overall_score: float = Field(..., ge=0, le=1)
    factors: list[RiskFactor]
    recommendations: list[str]
    assessed_at: datetime


# === Tender Schemas ===


class TenderBase(BaseModel):
    tender_id: str
    title: str
    status: str


class TenderResponse(TenderBase):
    model_config = ConfigDict(from_attributes=True)

    description: str | None = None
    amount: float | None = None
    currency: str = "UAH"
    procuring_entity_name: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class TenderSearchResponse(BaseModel):
    query: str
    count: int
    tenders: list[TenderResponse]


# === Exchange Rate Schemas ===


class ExchangeRateResponse(BaseModel):
    currency_code: str
    currency_name: str
    rate: float
    rate_date: datetime


class ExchangeRatesResponse(BaseModel):
    rates: list[ExchangeRateResponse]
    base_currency: str = "UAH"
    date: datetime


# === Analysis Schemas ===


class AnalysisRequest(BaseModel):
    query: str
    sectors: list[str] = Field(default=["GOV", "BIZ"])
    depth: str = Field(default="standard", pattern="^(quick|standard|deep)$")


class AnalysisSource(BaseModel):
    name: str
    type: str
    count: int
    data: list[dict[str, Any]] = []


class AnalysisResponse(BaseModel):
    query: str
    answer: str
    sources: list[AnalysisSource]
    confidence: float
    model_used: str
    processing_time_ms: float
    timestamp: datetime


# === Health Check ===


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
