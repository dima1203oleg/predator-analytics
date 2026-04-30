"""📋 Моделі митних декларацій — PREDATOR Analytics v4.1.

SQLAlchemy ORM для зберігання митних декларацій,
включаючи товарні позиції, суми, ваги та аномалії.
"""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import relationship

from app.models.entities import Base


class Declaration(Base):
    """Митна декларація."""

    __tablename__ = "declarations"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    declaration_number = Column(String(50), unique=True, nullable=False, index=True)
    declaration_date = Column(DateTime, nullable=False, index=True)
    declaration_type = Column(String(20))  # import, export, transit

    # Компанія-декларант
    company_id = Column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
    )
    company_name = Column(String(500))
    company_edrpou = Column(String(10), index=True)

    # Товар (УКТЗЕД код)
    product_code = Column(String(20), nullable=False, index=True)
    product_name = Column(String(500))
    product_description = Column(Text)

    # Країна
    country_code = Column(String(3), index=True)  # ISO 3166-1 alpha-2
    country_name = Column(String(100))

    # Обсяги
    weight_kg = Column(Float)
    weight_net_kg = Column(Float)
    quantity = Column(Float)
    quantity_unit = Column(String(20))  # шт, кг, л, м2

    # Вартість
    value_usd = Column(Float, index=True)
    value_uah = Column(Float)
    customs_value_usd = Column(Float)
    duty_uah = Column(Float)
    vat_uah = Column(Float)

    # Митниця
    customs_office = Column(String(100))
    customs_regime = Column(String(50))

    # Аналітика
    anomaly_score = Column(Float)  # 0-1, де 1 = дуже підозріло
    risk_flags = Column(JSON)  # Список виявлених ризиків

    # Метадані
    raw_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Зв'язки
    company = relationship("Company", back_populates="declarations")
