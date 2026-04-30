"""Predator v55 ORM — Behavioral Score.

Maps to: v55.behavioral_scores
Spec 5.1, 7.1-7.3: BVI, ASS, CP per entity.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import BigInteger, Column, Date, DateTime, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

from app.libs.core.database import Base


class BehavioralScoreORM(Base):
    """Behavioral layer scores for an entity over a time window."""

    __tablename__ = "behavioral_scores"
    __table_args__ = (
        Index("idx_behav_ueid", "ueid", "calculated_at"),
        {"schema": "v55"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ueid = Column(UUID(as_uuid=True), ForeignKey("v55.entities.ueid"), nullable=False)
    bvi = Column(Float, nullable=False, comment="Behavioral Volatility Index")
    ass = Column(Float, nullable=False, comment="Adaptation Speed Score")
    cp = Column(Float, nullable=False, comment="Collapse Probability")
    inertia_index = Column(Float, nullable=True, comment="Behavioral Inertia Index")
    aggregate = Column(
        Float, nullable=False, server_default="0", comment="Weighted aggregate 0-100"
    )
    confidence = Column(Float, nullable=False)
    calculated_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    data_window_start = Column(Date, nullable=True)
    data_window_end = Column(Date, nullable=True)

    def __repr__(self) -> str:
        return f"<BehavioralScore ueid={self.ueid} bvi={self.bvi} ass={self.ass} cp={self.cp}>"
