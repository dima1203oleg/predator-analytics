"""Predator v55 ORM — Decision Artifact (WORM).

Maps to: v55.decision_artifacts
Spec 3.3: Immutable record of every AI decision. Retention 7+ years.
UPDATE and DELETE are forbidden via DB trigger.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.libs.core.database import Base


class DecisionArtifactORM(Base):
    """Immutable audit trail for every analytical decision."""

    __tablename__ = "decision_artifacts"
    __table_args__ = (
        Index("idx_da_timestamp", "timestamp"),
        Index("idx_da_decision_type", "decision_type"),
        Index("idx_da_trace_id", "trace_id", postgresql_where="trace_id IS NOT NULL"),
        Index("idx_da_tenant_id", "tenant_id", postgresql_where="tenant_id IS NOT NULL"),
        {"schema": "v55"},
    )

    decision_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    tenant_id = Column(String(100), nullable=True)
    trace_id = Column(String(100), nullable=True)
    decision_type = Column(String(100), nullable=False)
    input_fingerprint = Column(String(64), nullable=False, comment="SHA-256 of input data")
    model_fingerprint = Column(String(64), nullable=True)
    output_fingerprint = Column(String(64), nullable=False, comment="SHA-256 of output data")
    confidence_score = Column(Float, nullable=False)
    explanation = Column(JSONB, nullable=True)
    sources = Column(JSONB, nullable=True)
    metadata_ = Column("metadata", JSONB, server_default="{}", nullable=False)

    def __repr__(self) -> str:
        return f"<DecisionArtifact {self.decision_id} type={self.decision_type}>"
