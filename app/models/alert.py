"""
🚨 Моделі алертів — PREDATOR Analytics v4.1.

SQLAlchemy ORM для зберігання сповіщень, тригерів
та автоматичних реакцій на аномалії.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import relationship

from app.models.entities import Base


class AlertSeverity(StrEnum):
    """Рівні критичності алертів."""

    INFO = "info"
    WARNING = "warning"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(StrEnum):
    """Статуси оброблення алертів."""

    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class Alert(Base):
    """Алерт / сповіщення системи."""

    __tablename__ = "alerts"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    alert_type = Column(String(50), nullable=False)  # anomaly, threshold, pattern, sanction
    severity = Column(String(20), default="warning")  # AlertSeverity
    status = Column(String(20), default="new")  # AlertStatus

    # Джерело алерту
    source_module = Column(String(50))  # market, diligence, monitoring
    entity_type = Column(String(50))  # company, declaration, product
    entity_id = Column(String(100))

    # Компанія (якщо пов'язано)
    company_id = Column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=True,
    )

    # Дані алерту
    score = Column(Float)  # 0-1 — ступінь аномалії
    details = Column(JSON)  # Деталі: що виявлено, чому
    evidence = Column(JSON)  # Докази: посилання на декларації тощо

    # Обробка
    assigned_to = Column(String(255))  # Email відповідального
    resolution_notes = Column(Text)
    resolved_at = Column(DateTime)

    # Метадані
    is_auto = Column(Boolean, default=True)  # Автоматично створений
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Зв'язки
    company = relationship("Company", back_populates="alerts")
