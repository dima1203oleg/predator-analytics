"""Predator v55 ORM — Influence Score.

Maps to: v55.influence_scores
Spec 6.1: IM, HCI, Shadow Cluster Score per entity.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

from app.libs.core.database import Base


class InfluenceScoreORM(Base):
    """Influence layer scores for an entity."""

    __tablename__ = "influence_scores"
    __table_args__ = (
        Index("idx_influence_ueid", "ueid", "calculated_at"),
        {"schema": "v55"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ueid = Column(UUID(as_uuid=True), ForeignKey("v55.entities.ueid"), nullable=False)
    im = Column(Float, nullable=False, comment="Influence Multiplier")
    hci = Column(Float, nullable=False, comment="Hidden Control Index")
    shadow_cluster_score = Column(Float, nullable=False, comment="Shadow Cluster Score")
    aggregate = Column(Float, nullable=False, server_default="0", comment="Weighted aggregate 0-100")
    confidence = Column(Float, nullable=False)
    calculated_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<InfluenceScore ueid={self.ueid} im={self.im} hci={self.hci} agg={self.aggregate}>"
