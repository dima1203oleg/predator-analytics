"""🌍 Моделі країн — PREDATOR Analytics v4.2.0.

Довідник країн (ISO 3166-1) для декларацій,
з індикаторами ризику та санкційним статусом.
"""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, String
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID

from app.core.database import Base


class Country(Base):
    """Країна (довідник ISO 3166-1)."""

    __tablename__ = "countries"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    iso_code = Column(String(2), unique=True, nullable=False, index=True)     # UA, CN, TR
    iso_code_3 = Column(String(3), unique=True)                                # UKR, CHN, TUR
    numeric_code = Column(String(3))                                           # 804, 156, 792
    name_uk = Column(String(200), nullable=False, index=True)                  # Україна
    name_en = Column(String(200))                                              # Ukraine

    # Географія
    region = Column(String(100))              # Europe, Asia, Americas...
    subregion = Column(String(100))           # Eastern Europe, East Asia...
    continent = Column(String(50))            # EU, AS, NA, SA, AF, OC, AN

    # Торговий профіль
    currency_code = Column(String(3))         # UAH, CNY, USD
    trade_agreements = Column(JSON)           # ["EU-UA DCFTA", "WTO"]
    customs_union = Column(String(100))       # EAEU, EU, MERCOSUR...

    # Ризик-профіль
    risk_level = Column(String(20), default="low")    # low, medium, high, critical
    risk_score = Column(Float, default=0.0)            # 0.0 – 1.0
    is_sanctioned = Column(Boolean, default=False)
    sanctions_lists = Column(JSON)                     # ["OFAC_SDN", "EU_SANCTIONS"]
    is_fatf_grey = Column(Boolean, default=False)      # FATF Grey List
    is_fatf_black = Column(Boolean, default=False)     # FATF Black List

    # CPI (Corruption Perceptions Index by Transparency International)
    cpi_score = Column(Float)                 # 0-100
    cpi_rank = Column(String(10))             # "122/180"

    # Торгівля з Україною (агреговані дані)
    total_import_to_ua_usd = Column(Float)    # Загальний імпорт в Україну (USD)
    total_export_from_ua_usd = Column(Float)  # Загальний експорт з України (USD)
    trade_balance_usd = Column(Float)         # Торговий баланс

    # Метадані
    meta = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
