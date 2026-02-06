from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import JSON, Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.ext.declarative import declarative_base

# We might need to share the Base if we want relationships to work across files
# ideally Base is defined in app.database or similar, but entities.py defined it locally.
# If entities.py defines Base = declarative_base(), we can't easily share it unless we import it from there.
from app.models.entities import Base


class Document(Base):
    """Canonical Document (Gold Layer)."""
    __tablename__ = "documents"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id = Column(PostgreSQLUUID(as_uuid=True), nullable=True) # Multi-tenant ready
    title = Column(String(512), nullable=False)
    content = Column(Text)
    source_type = Column(String(50), default="manual")
    meta = Column(JSON) # Flexible metadata

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
