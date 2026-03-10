"""
Shared Domain Models — PREDATOR Analytics v55.2-SM-EXTENDED.
Ці моделі використовуються як для SQLAlchemy, так і для Pydantic (через mapping).
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Company(Base):
    __tablename__ = "companies"
    ueid = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    edrpou = Column(String(20), unique=True, index=True)
    name = Column(String(500), nullable=False)
    status = Column(String(32), default="active")
    sector = Column(String(100))
    risk_score = Column(Float, default=0.0)
    cers_confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=text("now()"))
    updated_at = Column(DateTime, server_default=text("now()"))

class Declaration(Base):
    __tablename__ = "declarations"
    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    declaration_number = Column(String(50), unique=True, index=True)
    date = Column(DateTime, nullable=False, index=True)
    importer_ueid = Column(String(64), ForeignKey("companies.ueid"))
    hs_code = Column(String(12), index=True)
    customs_value_usd = Column(Float)
    description = Column(String)
    origin_country = Column(String(3))
    
class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    entity_ueid = Column(String(64), ForeignKey("companies.ueid"), index=True)
    score_date = Column(DateTime, nullable=False, index=True)
    cers = Column(Float, nullable=False)
    cers_confidence = Column(Float, nullable=False)
    behavioral_score = Column(Float)
    institutional_score = Column(Float)
    influence_score = Column(Float)
    structural_score = Column(Float)
    predictive_score = Column(Float)
    flags = Column(JSON, default=list)
    calculated_at = Column(DateTime, server_default=text("now()"))

class Anomaly(Base):
    __tablename__ = "som_anomalies"
    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    type = Column(String(50))
    severity = Column(String(20))
    message = Column(String(1000))
    detected_at = Column(DateTime, server_default=text("now()"))

class Proposal(Base):
    __tablename__ = "som_proposals"
    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    type = Column(String(50))
    confidence = Column(Float)
    title = Column(String(255))
    ueid = Column(String(64), index=True)
    created_at = Column(DateTime, server_default=text("now()"))

