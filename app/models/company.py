"""🏢 Моделі компаній — PREDATOR Analytics v4.1.

SQLAlchemy ORM для зберігання інформації про компанії,
їх власників, директорів, санкційні записи та зв'язки.
"""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import relationship

from app.models.entities import Base


class Company(Base):
    """Компанія / юридична особа."""

    __tablename__ = "companies"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    edrpou = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(500), nullable=False)
    short_name = Column(String(255))
    status = Column(String(50), default="active")  # active, inactive, suspended, liquidated
    registration_date = Column(DateTime)
    legal_form = Column(String(100))  # ТОВ, ПАТ, ФОП, ПП
    address = Column(Text)
    region = Column(String(100))

    # Ризик-аналіз
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default="low")  # low, medium, high, critical
    last_risk_assessment = Column(DateTime)

    # Фінансові показники
    authorized_capital = Column(Float)
    annual_revenue = Column(Float)
    employee_count = Column(Integer)

    # Зовнішні реєстри
    tax_status = Column(String(50))
    vat_number = Column(String(20))
    is_sanctioned = Column(Boolean, default=False)
    sanctions_info = Column(JSON)

    # Метадані
    meta = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Зв'язки
    declarations = relationship("Declaration", back_populates="company")
    alerts = relationship("Alert", back_populates="company")


class CompanyPerson(Base):
    """Фізична особа, пов'язана з компанією (директор, власник, бенефіціар)."""

    __tablename__ = "company_persons"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id = Column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
    )
    full_name = Column(String(500), nullable=False)
    role = Column(String(100), nullable=False)  # director, owner, beneficiary
    share_percent = Column(Float)  # Для власників — відсоток частки
    is_pep = Column(Boolean, default=False)  # Politically Exposed Person
    is_sanctioned = Column(Boolean, default=False)
    inn = Column(String(12))  # ІПН
    passport = Column(String(20))

    # Зв'язки
    meta = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
