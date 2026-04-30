"""Pydantic schemas для OSINT Service."""
from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ScanType(StrEnum):
    """Типи OSINT сканувань."""

    DOMAIN = "domain"
    PERSON = "person"
    COMPANY = "company"
    FILE = "file"
    CUSTOM = "custom"


class ScanStatus(StrEnum):
    """Статуси сканування."""

    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Severity(StrEnum):
    """Рівні критичності."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ======================== REQUEST MODELS ========================


class OSINTScanRequest(BaseModel):
    """Базовий запит на OSINT сканування."""

    scan_type: ScanType
    target: dict[str, Any]
    tools: list[str] | None = None
    depth: int = Field(default=2, ge=1, le=5)
    options: dict[str, Any] | None = None


class DomainScanRequest(BaseModel):
    """Запит на сканування домену."""

    domain: str = Field(..., description="Домен для сканування")
    depth: int = Field(default=2, ge=1, le=3, description="Глибина сканування")
    tools: list[str] | None = Field(
        default=None,
        description="Список інструментів (за замовчуванням всі)",
    )
    include_subdomains: bool = Field(default=True)
    include_emails: bool = Field(default=True)
    include_technologies: bool = Field(default=True)


class PersonSearchRequest(BaseModel):
    """Запит на пошук особи."""

    username: str | None = Field(default=None, description="Username для пошуку")
    email: str | None = Field(default=None, description="Email для пошуку")
    phone: str | None = Field(default=None, description="Телефон для пошуку")
    full_name: str | None = Field(default=None, description="Повне ім'я")
    tools: list[str] | None = None


class CompanyInvestigationRequest(BaseModel):
    """Запит на розслідування компанії."""

    company_name: str | None = Field(default=None, description="Назва компанії")
    edrpou: str | None = Field(default=None, description="Код ЄДРПОУ")
    domain: str | None = Field(default=None, description="Домен компанії")
    country: str = Field(default="UA", description="Країна (ISO 3166-1 alpha-2)")
    include_officers: bool = Field(default=True)
    include_shareholders: bool = Field(default=True)
    include_sanctions: bool = Field(default=True)


class FileAnalysisRequest(BaseModel):
    """Запит на аналіз файлу."""

    extract_metadata: bool = Field(default=True)
    extract_hidden_data: bool = Field(default=True)
    extract_geolocation: bool = Field(default=True)


# ======================== RESPONSE MODELS ========================


class OSINTScanResponse(BaseModel):
    """Відповідь на запит сканування."""

    scan_id: UUID
    status: ScanStatus
    estimated_time_seconds: int | None = None
    progress_url: str


class OSINTFinding(BaseModel):
    """Знахідка OSINT."""

    id: UUID
    finding_type: str
    source_tool: str
    confidence: float = Field(ge=0.0, le=1.0)
    data: dict[str, Any]
    entity_ueid: str | None = None
    created_at: datetime


class DomainScanResult(BaseModel):
    """Результат сканування домену."""

    scan_id: UUID
    status: ScanStatus
    domain: str
    subdomains: list[dict[str, Any]] = Field(default_factory=list)
    dns_records: list[dict[str, Any]] = Field(default_factory=list)
    emails: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    certificates: list[dict[str, Any]] = Field(default_factory=list)
    whois: dict[str, Any] | None = None
    ip_addresses: list[str] = Field(default_factory=list)
    ports: list[dict[str, Any]] = Field(default_factory=list)
    findings: list[OSINTFinding] = Field(default_factory=list)
    duration_seconds: float | None = None
    tools_used: list[str] = Field(default_factory=list)


class PersonSearchResult(BaseModel):
    """Результат пошуку особи."""

    search_id: UUID
    status: ScanStatus
    query: dict[str, str]
    profiles: list[dict[str, Any]] = Field(default_factory=list)
    emails: list[str] = Field(default_factory=list)
    phones: list[str] = Field(default_factory=list)
    locations: list[dict[str, Any]] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    usernames: list[dict[str, Any]] = Field(default_factory=list)
    findings: list[OSINTFinding] = Field(default_factory=list)
    duration_seconds: float | None = None
    tools_used: list[str] = Field(default_factory=list)


class CompanyInvestigationResult(BaseModel):
    """Результат розслідування компанії."""

    investigation_id: UUID
    status: ScanStatus
    company: dict[str, Any] = Field(default_factory=dict)
    officers: list[dict[str, Any]] = Field(default_factory=list)
    shareholders: list[dict[str, Any]] = Field(default_factory=list)
    related_companies: list[dict[str, Any]] = Field(default_factory=list)
    sanctions: list[dict[str, Any]] = Field(default_factory=list)
    risk_indicators: list[dict[str, Any]] = Field(default_factory=list)
    documents: list[dict[str, Any]] = Field(default_factory=list)
    domains: list[str] = Field(default_factory=list)
    findings: list[OSINTFinding] = Field(default_factory=list)
    duration_seconds: float | None = None
    tools_used: list[str] = Field(default_factory=list)


class FileAnalysisResult(BaseModel):
    """Результат аналізу файлу."""

    analysis_id: UUID
    status: ScanStatus
    file_name: str
    file_type: str
    file_size_bytes: int
    metadata: dict[str, Any] = Field(default_factory=dict)
    hidden_data: list[dict[str, Any]] = Field(default_factory=list)
    geolocation: dict[str, Any] | None = None
    author: str | None = None
    creation_date: datetime | None = None
    modification_date: datetime | None = None
    software: str | None = None
    findings: list[OSINTFinding] = Field(default_factory=list)


# ======================== GRAPH MODELS ========================


class GraphNode(BaseModel):
    """Вузол графу."""

    ueid: str
    type: str  # person, company, domain, email, phone, ip, location
    name: str
    properties: dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    sources: list[str] = Field(default_factory=list)


class GraphEdge(BaseModel):
    """Ребро графу."""

    source_ueid: str
    target_ueid: str
    relationship: str
    properties: dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    source_tool: str | None = None


# ======================== MONITORING MODELS ========================


class MonitorConfig(BaseModel):
    """Конфігурація моніторингу entity."""

    entity_ueid: str
    triggers: list[dict[str, Any]] = Field(default_factory=list)
    schedule: str = Field(default="0 */6 * * *", description="Cron expression")
    notification_channels: list[str] = Field(default_factory=list)
    is_active: bool = Field(default=True)


class OSINTAlert(BaseModel):
    """Алерт OSINT."""

    id: UUID
    monitor_id: UUID
    alert_type: str
    severity: Severity
    title: str
    details: dict[str, Any]
    entity_ueid: str
    is_read: bool = False
    created_at: datetime


# ======================== PROGRESS MODELS ========================


class ScanProgress(BaseModel):
    """Прогрес сканування."""

    scan_id: UUID
    status: ScanStatus
    progress_pct: float = Field(ge=0.0, le=100.0)
    current_tool: str | None = None
    findings_count: int = 0
    elapsed_seconds: float = 0
    estimated_remaining_seconds: float | None = None
    errors: list[str] = Field(default_factory=list)
