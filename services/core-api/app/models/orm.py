"""
ORM Моделі — PREDATOR Core API v55.2.

Реекспорт канонічних моделей з predator_common.models.
Core-api роутери мають використовувати ці моделі для взаємодії з PostgreSQL.

УВАГА: Не створювати альтернативних моделей — init.sql є єдиним джерелом правди.
"""
# Реекспорт з predator_common — єдиний канонічний набір ORM моделей
from predator_common.models import (
    Base,
    Tenant,
    User,
    Company,
    Person,
    Declaration,
    RiskScore,
    Anomaly,
    Proposal,
    IngestionJob,
    Alert,
)

# Зворотна сумісність: CustomsDeclaration = Declaration
CustomsDeclaration = Declaration

# AuditLog (WORM — тільки INSERT) — окремо, бо має специфіку
from sqlalchemy import Column, String, Text, DateTime, text
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
import uuid as _uuid


class AuditLog(Base):
    """WORM лог дій (HR-16). UPDATE/DELETE заборонені тригером у PostgreSQL."""
    __tablename__ = "audit_log"

    id = Column("id", type_=type(None), primary_key=True)
    tenant_id = Column(UUID(as_uuid=True))
    user_id = Column(UUID(as_uuid=True))
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100))
    resource_id = Column(String(255))
    ip_address = Column(INET)
    user_agent = Column(Text)
    details = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False, index=True)


class DecisionArtifact(Base):
    """WORM артефакти ШІ-рішень (HR-16). UPDATE/DELETE заборонені тригером."""
    __tablename__ = "decision_artifacts"

    id = Column("id", type_=type(None), primary_key=True)
    tenant_id = Column(UUID(as_uuid=True))
    decision_type = Column(String(100), nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(String(255))
    model_name = Column(String(255))
    model_version = Column(String(50))
    input_data = Column(JSONB, nullable=False)
    output_data = Column(JSONB, nullable=False)
    confidence = Column(type_=type(None))
    explanation = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False, index=True)


__all__ = [
    "Base",
    "Tenant",
    "User",
    "Company",
    "Person",
    "Declaration",
    "CustomsDeclaration",
    "RiskScore",
    "Anomaly",
    "Proposal",
    "IngestionJob",
    "Alert",
    "AuditLog",
    "DecisionArtifact",
]
