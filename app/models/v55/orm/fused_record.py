"""Predator v55 ORM — Fused Record.

Maps to: v55.fused_records
Spec: Stores the result of normalizing and fusing raw data.
"""

from __future__ import annotations

from datetime import UTC, datetime
import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.libs.core.database import Base


class FusedRecordORM(Base):
    """A record after data fusion, linked to a UEID."""

    __tablename__ = "fused_records"
    __table_args__ = (
        Index("idx_fused_ueid", "ueid"),
        Index("idx_fused_source", "source"),
        Index("idx_fused_fingerprint", "fingerprint"),
        {"schema": "v55"},
    )

    record_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ueid = Column(UUID(as_uuid=True), ForeignKey("v55.entities.ueid"), nullable=False)
    source = Column(String(50), nullable=False)
    raw_data = Column(JSONB, nullable=False)
    normalized_data = Column(JSONB, nullable=False)
    fingerprint = Column(String(64), nullable=False)
    quality_score = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    def __repr__(self) -> str:
        return f"<FusedRecord {self.record_id} source={self.source} ueid={self.ueid}>"
