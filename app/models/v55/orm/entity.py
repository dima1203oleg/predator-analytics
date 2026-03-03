"""Predator v55 ORM — Entity (UEID Registry).

Maps to: v55.entities
Spec: Section 10, COMP-001+ (Entity Resolution via UEID).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.libs.core.database import Base


class EntityORM(Base):
    """Unified Economic Entity — core node in the Predator knowledge graph."""

    __tablename__ = "entities"
    __table_args__ = (
        Index("idx_entities_edrpou", "edrpou", unique=True, postgresql_where="edrpou IS NOT NULL"),
        Index("idx_entities_fingerprint", "fingerprint"),
        Index("idx_entities_type", "entity_type"),
        # pg_trgm index is created by raw SQL in migration (GIN index not declarable here)
        {"schema": "v55"},
    )

    ueid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False, comment="company|person|broker|customs_post")
    name = Column(Text, nullable=False)
    name_normalized = Column(Text, nullable=False)
    edrpou = Column(String(10), nullable=True)
    inn = Column(String(12), nullable=True)
    fingerprint = Column(String(64), nullable=False, comment="SHA-256 of canonical name+type+edrpou")
    metadata_ = Column("metadata", JSONB, server_default="{}", nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<Entity {self.ueid} {self.entity_type}:{self.name_normalized}>"
