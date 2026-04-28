"""Kafka Event Schemas — PREDATOR Analytics v61.0-ELITE.

Канонічні Pydantic v2 схеми для всіх подій Kafka Event Bus.
Топіки: tenant.{id}.{category}.{name} (TZ §5.1)

Типи подій:
- ingestion.raw — Сирі дані від інгестії
- ingestion.cleaned — Очищені та валідовані дані
- entity.resolution — Результати Entity Resolution
- enrichment.events — Збагачення з OSINT/реєстрів
- risk.alerts — Алерти ризику (CERS)
- dlq — Dead Letter Queue (невалідні)
- quarantine — Карантин (підозрілі)
"""
from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class EventType(StrEnum):
    """Типи подій Kafka Event Bus."""

    # Ingestion pipeline
    INGESTION_RAW = "ingestion.raw"
    INGESTION_CLEANED = "ingestion.cleaned"
    INGESTION_FAILED = "ingestion.failed"

    # Entity Resolution
    ENTITY_RESOLVED = "entity.resolved"
    ENTITY_MERGED = "entity.merged"
    ENTITY_SPLIT = "entity.split"

    # Enrichment
    ENRICHMENT_COMPLETED = "enrichment.completed"
    ENRICHMENT_FAILED = "enrichment.failed"

    # Risk
    RISK_SCORE_UPDATED = "risk.score_updated"
    RISK_ALERT_CREATED = "risk.alert_created"
    RISK_THRESHOLD_BREACH = "risk.threshold_breach"

    # AML/Sanctions
    SANCTIONS_HIT = "sanctions.hit"
    PEP_HIT = "pep.hit"

    # System
    DLQ = "dlq"
    QUARANTINE = "quarantine"
    SYSTEM_LOG = "system.log"


class EventPriority(StrEnum):
    """Пріоритет обробки події."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


# ------------------------------------------------------------------
# Base Event
# ------------------------------------------------------------------


class EventHeader(BaseModel):
    """Заголовок кожної Kafka-події."""

    event_id: str = Field(..., description="UUID події")
    event_type: EventType = Field(..., description="Тип події")
    tenant_id: str = Field(..., description="ID тенанту")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Час створення")
    source: str = Field(default="core-api", description="Сервіс-відправник")
    correlation_id: str | None = Field(None, description="ID для трасування ланцюга подій")
    priority: EventPriority = Field(default=EventPriority.NORMAL)
    version: str = Field(default="1.0", description="Версія схеми")


class BaseEvent(BaseModel):
    """Базова подія Kafka."""

    header: EventHeader
    payload: dict[str, Any] = Field(default_factory=dict)


# ------------------------------------------------------------------
# Ingestion Events
# ------------------------------------------------------------------


class IngestionRawEvent(BaseEvent):
    """Сирі дані з інгестії (Excel/CSV/API).

    Топік: tenant.{id}.ingestion.raw
    """

    class IngestionPayload(BaseModel):
        """Корисне навантаження сирих даних."""

        job_id: str
        file_name: str
        file_path: str
        record_index: int
        raw_record: dict[str, Any]
        source_type: str = "excel"  # excel, csv, api, manual

    payload: IngestionPayload  # type: ignore[assignment]


class IngestionCleanedEvent(BaseEvent):
    """Очищені та валідовані дані.

    Топік: tenant.{id}.ingestion.cleaned
    """

    class CleanedPayload(BaseModel):
        """Корисне навантаження очищених даних."""

        job_id: str
        record_index: int
        declaration_number: str | None = None
        importer_name: str | None = None
        importer_edrpou: str | None = None
        uktzed_code: str | None = None
        customs_value_usd: float | None = None
        country_origin: str | None = None
        normalized_record: dict[str, Any] = Field(default_factory=dict)
        validation_flags: list[str] = Field(default_factory=list)

    payload: CleanedPayload  # type: ignore[assignment]


# ------------------------------------------------------------------
# Entity Resolution Events
# ------------------------------------------------------------------


class EntityResolvedEvent(BaseEvent):
    """Результат Entity Resolution.

    Топік: tenant.{id}.entity.resolution
    """

    class EntityPayload(BaseModel):
        """Корисне навантаження результатів Entity Resolution."""

        ueid: str
        entity_type: str  # company | person
        name: str
        name_normalized: str
        identifiers: dict[str, str] = Field(default_factory=dict)
        match_type: str  # exact_id | fuzzy_name | new
        confidence: float
        is_new: bool
        source_job_id: str | None = None

    payload: EntityPayload  # type: ignore[assignment]


# ------------------------------------------------------------------
# Risk Events
# ------------------------------------------------------------------


class RiskScoreUpdatedEvent(BaseEvent):
    """Оновлення ризику сутності.

    Топік: tenant.{id}.risk.alerts
    """

    class RiskPayload(BaseModel):
        """Корисне навантаження оновлення ризику."""

        entity_ueid: str
        entity_type: str
        previous_score: float | None = None
        new_score: float
        cers_level: str
        components: dict[str, float] = Field(default_factory=dict)
        explanation: str | None = None
        alert_triggered: bool = False

    payload: RiskPayload  # type: ignore[assignment]


class SanctionsHitEvent(BaseEvent):
    """Збіг у санкційних списках.

    Топік: tenant.{id}.risk.alerts (priority=CRITICAL)
    """

    class SanctionsPayload(BaseModel):
        """Корисне навантаження збігу санкцій."""

        entity_ueid: str
        entity_name: str
        list_name: str  # RNBO, EU, OFAC, UN
        match_score: float
        matched_entry: str
        entry_details: dict[str, Any] = Field(default_factory=dict)

    payload: SanctionsPayload  # type: ignore[assignment]


# ------------------------------------------------------------------
# DLQ / Quarantine Events
# ------------------------------------------------------------------


class DLQEvent(BaseEvent):
    """Dead Letter Queue — невалідні записи.

    Топік: tenant.{id}.dlq
    """

    class DLQPayload(BaseModel):
        """Корисне навантаження Dead Letter Queue."""

        original_topic: str
        original_event_id: str
        error_message: str
        error_type: str  # validation | processing | timeout
        retry_count: int = 0
        original_payload: dict[str, Any] = Field(default_factory=dict)

    payload: DLQPayload  # type: ignore[assignment]


class QuarantineEvent(BaseEvent):
    """Карантин — підозрілі записи для ручної перевірки.

    Топік: tenant.{id}.quarantine
    """

    class QuarantinePayload(BaseModel):
        """Корисне навантаження карантину."""

        job_id: str
        record_index: int
        original_record: dict[str, Any]
        quarantine_reasons: list[str]
        severity: str = "medium"  # low | medium | high

    payload: QuarantinePayload  # type: ignore[assignment]


class SystemLogEvent(BaseEvent):
    """Системний лог для моніторингу хмарних вузлів.

    Топік: tenant.{id}.system.log
    """

    class LogPayload(BaseModel):
        """Корисне навантаження системного логу."""

        level: str
        logger: str
        message: str
        service: str
        timestamp: str
        context: dict[str, Any] = Field(default_factory=dict)
        exception: str | None = None

    payload: LogPayload  # type: ignore[assignment]
