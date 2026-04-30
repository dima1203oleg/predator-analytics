"""Predator v55 ORM — Institutional Score.

Maps to: v55.institutional_scores
Spec 6.2: AAI, PLS, RDI, RSI per entity/region.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

from app.libs.core.database import Base


class InstitutionalScoreORM(Base):
    """Institutional layer scores for an entity."""

    __tablename__ = "institutional_scores"
    __table_args__ = (
        Index("idx_institutional_ueid", "ueid", "calculated_at"),
        {"schema": "v55"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ueid = Column(UUID(as_uuid=True), ForeignKey("v55.entities.ueid"), nullable=False)
    aai = Column(Float, nullable=False, comment="Average Approval Index")
    pls = Column(Float, nullable=False, comment="Post Loyalty Score")
    rdi = Column(Float, nullable=False, comment="Regional Divergence Index")
    rsi = Column(Float, nullable=False, comment="Regulatory Shift Index")
    aggregate = Column(Float, nullable=False, server_default="0", comment="Weighted aggregate 0-100")
    confidence = Column(Float, nullable=False)
    calculated_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    def __repr__(self) -> str:
        return f"<InstitutionalScore ueid={self.ueid} aai={self.aai} pls={self.pls} agg={self.aggregate}>"
