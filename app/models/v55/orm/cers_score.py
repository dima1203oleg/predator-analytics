"""Predator v55 ORM — CERS Score.

Maps to: v55.cers_scores
Spec 7.10: Composite Economic Risk Score history per entity.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import BigInteger, Boolean, Column, DateTime, Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.libs.core.database import Base


class CERSScoreORM(Base):
    """Historical CERS score for an entity."""

    __tablename__ = "cers_scores"
    __table_args__ = (
        Index("idx_cers_ueid", "ueid", "calculated_at"),
        Index("idx_cers_level", "level"),
        {"schema": "v55"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ueid = Column(UUID(as_uuid=True), ForeignKey("v55.entities.ueid"), nullable=False)
    score = Column(Float, nullable=False, comment="CERS score 0-100")
    level = Column(String(20), nullable=False, comment="stable|watchlist|elevated|high_alert|critical")
    components = Column(JSONB, nullable=False, comment="Score per analytical layer")
    weights = Column(JSONB, nullable=False, comment="Weights used for each layer")
    confidence = Column(Float, nullable=False)
    decorrelation_applied = Column(Boolean, server_default="false")
    calculated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    def __repr__(self) -> str:
        return f"<CERSScore ueid={self.ueid} score={self.score} level={self.level}>"
