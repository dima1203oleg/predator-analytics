"""
📦 Моделі товарів (УКТЗЕД) — PREDATOR Analytics v4.1.

SQLAlchemy ORM для зберігання товарних позицій
за Українською класифікацією товарів ЗЕД.
"""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID

from app.models.entities import Base


class Product(Base):
    """Товарна позиція за УКТЗЕД."""

    __tablename__ = "products"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name_uk = Column(String(500), nullable=False)
    name_en = Column(String(500))
    description = Column(Text)

    # Ієрархія УКТЗЕД
    section = Column(String(10))   # Розділ (I-XXI)
    chapter = Column(String(10))   # Група (01-99)
    heading = Column(String(10))   # Товарна позиція (4 цифри)
    subheading = Column(String(10))  # Підпозиція (6 цифр)

    # Мита та ставки
    duty_rate = Column(Float)       # Базова ставка мита (%)
    vat_rate = Column(Float, default=20.0)  # ПДВ (%)
    excise_rate = Column(Float)     # Акциз (якщо є)

    # Обмеження
    is_restricted = Column(String(50))  # none, license, quota, ban
    restrictions_info = Column(JSON)

    # Статистика
    total_import_volume = Column(Float)   # Загальний обсяг імпорту (USD)
    total_import_weight = Column(Float)   # Загальна вага (кг)
    avg_price_per_kg = Column(Float)      # Середня ціна за кг (USD)
    declaration_count = Column(Integer)   # Кількість декларацій

    # Метадані
    meta = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
