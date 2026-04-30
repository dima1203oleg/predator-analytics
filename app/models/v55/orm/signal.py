"""Predator v55 ORM — Signal.

Maps to: v55.signals
Analytical signals emitted by the 5-layer engine.
"""

from __future__ import annotations

from datetime import UTC, datetime
import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.libs.core.database import Base


class SignalORM(Base):
    """Analytical signal record."""

    __tablename__ = "signals"
    __table_args__ = (
        Index("idx_signals_ueid", "ueid", "created_at"),
        Index("idx_signals_layer", "layer"),
        Index("idx_signals_type", "signal_type"),
        Index("idx_signals_created", "created_at"),
        {"schema": "v55"},
    )

    signal_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    signal_type = Column(String(50), nullable=False, comment="anomaly|alert|warning|info|prediction|pattern")
    topic = Column(String(200), nullable=False)
    ueid = Column(UUID(as_uuid=True), ForeignKey("v55.entities.ueid"), nullable=True)
    layer = Column(String(50), nullable=False, comment="behavioral|institutional|influence|structural|predictive")
    score = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    summary = Column(Text, nullable=True)
    details = Column(JSONB, server_default="{}", nullable=False)
    sources = Column(JSONB, server_default="[]", nullable=False)
    trace_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    def __repr__(self) -> str:
        return f"<Signal {self.signal_id} {self.signal_type}:{self.layer}>"
