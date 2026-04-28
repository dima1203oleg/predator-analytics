"""Shared Domain Models — PREDATOR Analytics v55.2-SM-EXTENDED.

Канонічні ORM-моделі, вирівняні з db/postgres/init.sql.
Ці моделі використовуються core-api, ingestion-worker та іншими сервісами.
"""
import uuid as _uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


# ============================================================
# Тенанти
# ============================================================
class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    plan = Column(String(50), nullable=False, default="basic")
    is_active = Column(Boolean, nullable=False, default=True)
    max_users = Column(Integer, nullable=False, default=10)
    max_storage_gb = Column(Integer, nullable=False, default=50)
    settings = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)


# ============================================================
# Користувачі
# ============================================================
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="viewer")
    is_active = Column(Boolean, nullable=False, default=True)
    last_login_at = Column(DateTime(timezone=True))
    mfa_enabled = Column(Boolean, nullable=False, default=False)
    mfa_secret = Column(String(255))
    preferences = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)


# ============================================================
# Компанії
# ============================================================
class Company(Base):
    __tablename__ = "companies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # SCD Type 2 поля
    business_key = Column(UUID(as_uuid=True), nullable=False, index=True)
    valid_from = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    valid_to = Column(DateTime(timezone=True))
    is_current = Column(Boolean, server_default=text("true"), nullable=False, index=True)

    ueid = Column(String(64), nullable=False, index=True)
    edrpou = Column(String(10), index=True)
    name = Column(String(500), nullable=False)
    name_normalized = Column(String(500))
    legal_form = Column(String(100))
    status = Column(String(50), default="active")
    registration_date = Column(Date)
    address = Column(Text)
    address_normalized = Column(Text)
    phone = Column(String(50))
    email = Column(String(255))
    website = Column(String(500))
    industry = Column(String(255))
    # Поля для швидкого доступу до CERS (кешовані)
    cers_score = Column(SmallInteger)
    cers_level = Column(String(20))
    cers_updated_at = Column(DateTime(timezone=True))
    cers_confidence = Column(Float)
    sector = Column(String(100))
    source = Column(String(100))
    content_hash = Column(String(64))
    raw_data = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    # Relationships
    declarations = relationship("Declaration", back_populates="importer", foreign_keys="[Declaration.importer_ueid]", primaryjoin="Company.ueid == Declaration.importer_ueid")

    # Зворотна сумісність: property для коду, що використовує risk_score
    @property
    def risk_score(self) -> int:
        """Зворотна сумісність — cers_score як risk_score."""
        return self.cers_score or 0


# ============================================================
# Фізичні особи
# ============================================================
class Person(Base):
    __tablename__ = "persons"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # SCD Type 2 поля
    business_key = Column(UUID(as_uuid=True), nullable=False, index=True)
    valid_from = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    valid_to = Column(DateTime(timezone=True))
    is_current = Column(Boolean, server_default=text("true"), nullable=False, index=True)

    ueid = Column(String(64), nullable=False, index=True)
    inn = Column(String(10), index=True)
    full_name = Column(String(500), nullable=False)
    full_name_normalized = Column(String(500))
    date_of_birth = Column(Date)
    is_pep = Column(Boolean, nullable=False, default=False)
    is_sanctioned = Column(Boolean, nullable=False, default=False)
    pep_details = Column(JSONB)
    sanctions_details = Column(JSONB)
    source = Column(String(100))
    content_hash = Column(String(64))
    confidence_score = Column(Float, nullable=True)
    raw_data = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)


# ============================================================
# Митні декларації
# ============================================================
class Declaration(Base):
    __tablename__ = "declarations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    declaration_number = Column(String(50), nullable=False, index=True)
    declaration_date = Column(Date, index=True)
    direction = Column(String(10), nullable=False, default="import")
    importer_ueid = Column(String(64), index=True)
    importer_name = Column(String(500))
    importer_edrpou = Column(String(10))
    exporter_ueid = Column(String(64))
    exporter_name = Column(String(500))
    exporter_country = Column(String(100))
    uktzed_code = Column(String(20), nullable=False, index=True)
    goods_description = Column(Text)
    goods_description_normalized = Column(Text)
    quantity = Column(Numeric(18, 4))
    unit = Column(String(20))
    net_weight_kg = Column(Numeric(18, 4))
    gross_weight_kg = Column(Numeric(18, 4))
    invoice_value_usd = Column(Numeric(18, 2))
    customs_value_usd = Column(Numeric(18, 2))
    statistical_value_usd = Column(Numeric(18, 2))
    price_per_unit_usd = Column(Numeric(18, 4))
    country_origin = Column(String(100))
    country_destination = Column(String(100))
    customs_post = Column(String(255))
    source = Column(String(100))
    content_hash = Column(String(64))
    raw_data = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    # Relationship
    importer = relationship("Company", back_populates="declarations", foreign_keys=[importer_ueid],
                            primaryjoin="Declaration.importer_ueid == Company.ueid")


# ============================================================
# Risk Scores (CERS — 5-рівнева оцінка)
# ============================================================
class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_ueid = Column(String(64), nullable=False, index=True)
    entity_type = Column(String(50), default="company")
    score_date = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"), index=True)
    cers = Column(Float, nullable=False)
    cers_confidence = Column(Float, nullable=False, default=0.0)
    behavioral_score = Column(Float)
    institutional_score = Column(Float)
    influence_score = Column(Float)
    structural_score = Column(Float)
    predictive_score = Column(Float)
    flags = Column(JSONB, server_default=text("'[]'::jsonb"))
    explanation = Column(JSONB)
    calculated_at = Column(DateTime(timezone=True), server_default=text("now()"))


# ============================================================
# SOM Аномалії
# ============================================================
class Anomaly(Base):
    __tablename__ = "som_anomalies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50))
    severity = Column(String(20))
    entity_ueid = Column(String(64), index=True)
    message = Column(String(1000))
    details = Column(JSONB)
    detected_at = Column(DateTime(timezone=True), server_default=text("now()"))


# ============================================================
# SOM Пропозиції
# ============================================================
class Proposal(Base):
    __tablename__ = "som_proposals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50))
    confidence = Column(Float)
    title = Column(String(255))
    ueid = Column(String(64), index=True)
    status = Column(String(20), default="pending")
    details = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))


# ============================================================
# Ingestion Jobs
# ============================================================
class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_type = Column(String(50), nullable=False)
    file_name = Column(String(500))
    file_size = Column(Integer)
    file_path = Column(Text)
    status = Column(String(50), nullable=False, default="pending")
    progress = Column(SmallInteger, default=0)
    records_total = Column(Integer)
    records_processed = Column(Integer, default=0)
    records_errors = Column(Integer, default=0)
    error_message = Column(Text)
    metadata_ = Column("metadata", JSONB, server_default=text("'{}'::jsonb"))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)


# ============================================================
# Alerts / Сповіщення
# ============================================================
class Alert(Base):
    __tablename__ = "alerts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    name = Column(String(255))
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False, default="info")
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(String(255))
    is_read = Column(Boolean, nullable=False, default=False)
    enabled = Column(Boolean, nullable=False, default=True)
    condition_config = Column(JSONB, server_default=text("'{}'::jsonb"))
    actions = Column(JSONB, server_default=text("'[]'::jsonb"))
    metadata_ = Column("metadata", JSONB, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)


# ============================================================
# Alert Events (Історія спрацювань алертів)
# ============================================================
class AlertEvent(Base):
    """Подія спрацювання алерту. Згідно TZ §2.3.1."""

    __tablename__ = "alert_events"
    event_id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_id = Column(UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    entity_ueid = Column(String(64), index=True)
    payload = Column(JSONB, nullable=False)
    delivery_status = Column(JSONB, server_default=text("'{}'::jsonb"))


# ============================================================
# Customs Declarations (Митні декларації з інгестії)
# ============================================================
class CustomsDeclaration(Base):
    """Митні декларації з інгестованих файлів."""

    __tablename__ = "customs_declarations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    declaration_number = Column(String(100))
    declaration_date = Column(Date)
    company_edrpou = Column(String(10), index=True)
    ueid = Column(String(64), index=True)
    product_description = Column(Text)
    uktzed_code = Column(String(20), index=True)
    customs_value = Column(Numeric(18, 2))
    weight = Column(Numeric(18, 4))
    country_origin = Column(String(100), index=True)
    customs_post = Column(String(255))
    record_hash = Column(String(64), unique=True, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("ingestion_jobs.id"))
    validation_flags = Column(JSONB, server_default=text("'[]'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)


# ============================================================
# Ingestion Quarantine (DLQ для невалідних записів)
# ============================================================
class IngestionQuarantine(Base):
    """Карантин для невалідних записів (DLQ)."""

    __tablename__ = "ingestion_quarantine"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("ingestion_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    original_record = Column(JSONB, nullable=False)
    errors = Column(JSONB, nullable=False)
    quarantined_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    resolved_at = Column(DateTime(timezone=True))
    resolution_action = Column(String(50))
    resolution_notes = Column(Text)


# ============================================================
# Decision Artifacts (WORM таблиця для аудиту)
# ============================================================
class DecisionArtifact(Base):
    """Артефакт рішення AI/ML. WORM таблиця згідно TZ §2.3.1 та HR-16."""

    __tablename__ = "decision_artifacts"
    decision_id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    trace_id = Column(String(64), nullable=False, index=True)
    decision_type = Column(String(32), nullable=False)
    model_id = Column(String(128))
    input_context_hash = Column(String(64), nullable=False)
    output_payload = Column(JSONB, nullable=False)
    confidence_score = Column(Float, nullable=False)
    supporting_sources = Column(JSONB, server_default=text("'[]'::jsonb"))
    explanation = Column(JSONB)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_at = Column(DateTime(timezone=True))
