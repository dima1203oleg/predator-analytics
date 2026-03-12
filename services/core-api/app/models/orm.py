"""ORM Моделі — PREDATOR Core API v55.2.

Реекспорт канонічних моделей з predator_common.models.
Core-api роутери мають використовувати ці моделі для взаємодії з PostgreSQL.
УВАГА: Не створювати альтернативних моделей — init.sql є єдиним джерелом правди.
"""
from sqlalchemy import BigInteger, Column, DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID

# Реекспорт з predator_common — єдиний канонічний набір ORM моделей
from predator_common.models import (
    Alert,
    Anomaly,
    Base,
    Company,
    DecisionArtifact,
    Declaration,
    IngestionJob,
    Person,
    Proposal,
    RiskScore,
    Tenant,
    User,
)

# Зворотна сумісність: CustomsDeclaration = Declaration
CustomsDeclaration = Declaration

# AuditLog (WORM — тільки INSERT) — окремо, бо має специфіку


class AuditLog(Base):
    """WORM лог дій (HR-16). UPDATE/DELETE заборонені тригером у PostgreSQL."""

    __tablename__ = "audit_log"

    id = Column(BigInteger, primary_key=True)
    tenant_id = Column(UUID(as_uuid=True))
    user_id = Column(UUID(as_uuid=True))
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100))
    resource_id = Column(String(255))
    ip_address = Column(INET)
    user_agent = Column(Text)
    details = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False, index=True)


__all__ = [
    "Alert",
    "Anomaly",
    "AuditLog",
    "Base",
    "Company",
    "CustomsDeclaration",
    "DecisionArtifact",
    "Declaration",
    "IngestionJob",
    "Person",
    "Proposal",
    "RiskScore",
    "Tenant",
    "User",
]
