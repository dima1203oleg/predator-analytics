"""
Shared Domain Models — PREDATOR Analytics v55.2-SM-EXTENDED.

Канонічні ORM-моделі, вирівняні з db/postgres/init.sql.
Ці моделі використовуються core-api, ingestion-worker та іншими сервісами.
"""
from sqlalchemy import (
    Column, String, Integer, SmallInteger, Float, Numeric,
    DateTime, Date, Boolean, ForeignKey, JSON, Text, text,
)
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from sqlalchemy.orm import declarative_base, relationship
import uuid as _uuid

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
    declarations = relationship("Declaration", back_populates="importer", foreign_keys="[Declaration.importer_ueid]")

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
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False, default="info")
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(String(255))
    is_read = Column(Boolean, nullable=False, default=False)
    metadata_ = Column("metadata", JSONB, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
