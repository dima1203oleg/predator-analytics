"""Predator v55 ORM — Predictive Score.

Maps to: v55.predictive_scores
Spec 6.4: Risks predictions.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

from app.libs.core.database import Base


class PredictiveScoreORM(Base):
    """Predictive layer scores for an entity."""

    __tablename__ = "predictive_scores"
    __table_args__ = (
        Index("idx_predictive_ueid", "ueid", "calculated_at"),
        {"schema": "v55"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ueid = Column(UUID(as_uuid=True), ForeignKey("v55.entities.ueid"), nullable=False)
    disappearance_risk = Column(Float, nullable=False, comment="Disappearance Risk")
    regulatory_intervention_risk = Column(Float, nullable=False, comment="Regulatory Intervention Risk")
    concentration_risk = Column(Float, nullable=False, comment="Concentration Risk")
    scheme_emergence_risk = Column(Float, nullable=False, comment="Scheme Emergence Risk")
    aggregate = Column(Float, nullable=False, server_default="0", comment="Weighted aggregate 0-100")
    confidence = Column(Float, nullable=False)
    calculated_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<PredictiveScore ueid={self.ueid} dis={self.disappearance_risk} agg={self.aggregate}>"
