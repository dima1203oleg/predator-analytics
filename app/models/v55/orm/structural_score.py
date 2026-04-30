"""Predator v55 ORM — Structural Score.

Maps to: v55.structural_scores
Spec 6.3: MCI, PFI, TDI, LGS per entity.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

from app.libs.core.database import Base


class StructuralScoreORM(Base):
    """Structural Gap layer scores for an entity."""

    __tablename__ = "structural_scores"
    __table_args__ = (
        Index("idx_structural_ueid", "ueid", "calculated_at"),
        {"schema": "v55"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ueid = Column(UUID(as_uuid=True), ForeignKey("v55.entities.ueid"), nullable=False)
    mci = Column(Float, nullable=False, comment="Market Consistency Index")
    pfi = Column(Float, nullable=False, comment="Production Flow Index")
    tdi = Column(Float, nullable=False, comment="Trade Discrepancy Index")
    lgs = Column(Float, nullable=False, comment="Logistics Gap Score")
    aggregate = Column(Float, nullable=False, server_default="0", comment="Weighted aggregate 0-100")
    confidence = Column(Float, nullable=False)
    calculated_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    def __repr__(self) -> str:
        return f"<StructuralScore ueid={self.ueid} mci={self.mci} agg={self.aggregate}>"
