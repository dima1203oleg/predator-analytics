"""
👤 Моделі користувачів — PREDATOR Analytics v4.1.

SQLAlchemy ORM для зберігання користувачів платформи,
їх ролей, підписок та налаштувань.
"""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    JSON,
    String,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID

from app.models.entities import Base


class User(Base):
    """Користувач платформи PREDATOR Analytics."""

    __tablename__ = "users"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    organization = Column(String(255))

    # Автентифікація
    keycloak_id = Column(String(255), unique=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Роль та підписка
    role = Column(String(50), default="business")  # UserRole
    subscription_tier = Column(String(50), default="basic")  # SubscriptionTier
    subscription_expires = Column(DateTime)

    # Налаштування
    preferences = Column(JSON)  # Мова, тема, сповіщення тощо
    persona = Column(String(50))  # Активна персона в UI

    # Аудит
    last_login = Column(DateTime)
    login_count = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
