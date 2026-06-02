"""Analytics Models for Predator Analytics v63.0-ELITE.

Моделі для аналітичних шарів:
- BehavioralProfile
- InstitutionalBias
- InfluenceGraph
- StructuralAnomaly
- PredictiveAlert
- MarketPulse
- TaxCompliance (новий)
- RouteAnomaly (новий)
- PriceAnomaly (новий)
- BrandDetection (новий)
- RegulatoryImpact (новий)
- BrokerPattern (новий)
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class BehavioralProfile(Base):
    """Layer 1: Behavioral Profile (101-120)."""
    __tablename__ = "behavioral_profiles"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    entity_id = Column(PG_UUID(as_uuid=True), nullable=False)
    entity_type = Column(String(50), default="company")
    memory_score = Column(Float, default=0.0)
    temperature = Column(Float, default=0.0)
    maturity_stage = Column(String(50))
    last_update = Column(DateTime, default=datetime.utcnow)


class InstitutionalBias(Base):
    """Layer 2: Institutional Bias (121-140)."""
    __tablename__ = "institutional_biases"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    institution_id = Column(String(255), nullable=False)
    institution_type = Column(String(50), default="customs_post")
    loyalty_index = Column(Float, default=0.0)
    asymmetry_coefficient = Column(Float, default=0.0)
    turbulence_rate = Column(Float, default=0.0)
    last_reconciliation = Column(DateTime, default=datetime.utcnow)
    active_monopolies = Column(JSON, default=list)


class InfluenceGraph(Base):
    """Layer 3: Influence Graph (141-160)."""
    __tablename__ = "influence_graphs"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    source_id = Column(PG_UUID(as_uuid=True), nullable=False)
    target_id = Column(PG_UUID(as_uuid=True), nullable=False)
    connection_type = Column(String(50))
    gravity_weight = Column(Float, default=0.0)
    is_shadow = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class StructuralAnomaly(Base):
    """Layer 4: Structural Anomaly (161-180)."""
    __tablename__ = "structural_anomalies"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    anomaly_type = Column(String(100))
    region = Column(String(100))
    uctzed_code = Column(String(20))
    gap_magnitude = Column(Float)
    confidence_level = Column(Float)
    description = Column(String(1000))
    detected_at = Column(DateTime, default=datetime.utcnow)


class PredictiveAlert(Base):
    """Layer 5: Predictive Alert (181-200)."""
    __tablename__ = "predictive_alerts"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    predictive_type = Column(String(100))
    probability = Column(Float)
    entity_id = Column(PG_UUID(as_uuid=True))
    description = Column(String(1000))
    valid_until = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class MarketPulse(Base):
    """Market Pulse (200)."""
    __tablename__ = "market_pulses"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    turbulence_index = Column(Float)
    system_health = Column(String(50))
    active_anomalies = Column(Integer)
    behavioral_score = Column(Float)
    institutional_score = Column(Float)
    structural_score = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)


class DecisionArtifact(Base):
    """Decision Artifacts (WORM)."""
    __tablename__ = "decision_artifacts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(PG_UUID(as_uuid=True))
    decision_type = Column(String(100), nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(String(255))
    model_name = Column(String(255))
    model_version = Column(String(50))
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON, nullable=False)
    confidence = Column(Float)
    explanation = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================
# Нові моделі для 100% покриття датасетів
# ============================================================

class TaxCompliance(Base):
    """Layer 6: Tax Compliance (201-220).
    Для датасетів: #6, #17, #39, #59, #72
    """
    __tablename__ = "tax_compliance"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    company_ueid = Column(String(64), nullable=False)
    tax_gap = Column(Float, default=0.0)  # Різниця між імпортом та податками
    payment_gap_days = Column(Integer, default=0)  # Дні затримки оплати
    vat_discrepancy = Column(Float, default=0.0)  # Невідповідність ПДВ
    compliance_score = Column(Float, default=0.85)
    flags = Column(JSON, default=list)
    analyzed_at = Column(DateTime, default=datetime.utcnow)


class RouteAnomaly(Base):
    """Layer 7: Route Anomaly (221-240).
    Для датасетів: #3, #46, #62
    """
    __tablename__ = "route_anomalies"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    declaration_id = Column(String(255))
    distance_km = Column(Float, default=0.0)
    optimal_distance_km = Column(Float, default=0.0)
    detour_ratio = Column(Float, default=0.0)  # Коефіцієнт обходу
    is_suspicious = Column(Boolean, default=False)
    analyzed_at = Column(DateTime, default=datetime.utcnow)


class PriceAnomaly(Base):
    """Layer 8: Price Anomaly (241-260).
    Для датасетів: #5, #44, #89
    """
    __tablename__ = "price_anomalies"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    uktzed_code = Column(String(20), nullable=False)
    company_ueid = Column(String(64))
    company_price = Column(Float, default=0.0)
    market_avg_price = Column(Float, default=0.0)
    price_deviation_pct = Column(Float, default=0.0)
    is_dumping = Column(Boolean, default=False)
    is_overpriced = Column(Boolean, default=False)
    analyzed_at = Column(DateTime, default=datetime.utcnow)


class BrandDetection(Base):
    """Layer 9: Brand Detection (261-280).
    Для датасетів: #8, #53, #98
    """
    __tablename__ = "brand_detections"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    goods_description = Column(String(1000))
    detected_brands = Column(JSON, default=list)
    is_counterfeit = Column(Boolean, default=False)
    confidence = Column(Float, default=0.0)
    analyzed_at = Column(DateTime, default=datetime.utcnow)


class RegulatoryImpact(Base):
    """Layer 10: Regulatory Impact (281-300).
    Для датасетів: #1, #76
    """
    __tablename__ = "regulatory_impacts"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    act_date = Column(DateTime, nullable=False)
    uktzed_code = Column(String(20))
    import_before = Column(Float, default=0.0)
    import_after = Column(Float, default=0.0)
    growth_pct = Column(Float, default=0.0)
    is_suspicious = Column(Boolean, default=False)
    analyzed_at = Column(DateTime, default=datetime.utcnow)


class BrokerPattern(Base):
    """Layer 11: Broker Pattern (301-320).
    Для датасетів: #9, #71
    """
    __tablename__ = "broker_patterns"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    broker_ueid = Column(String(64), nullable=False)
    total_declarations = Column(Integer, default=0)
    unique_clients = Column(Integer, default=0)
    concentration_ratio = Column(Float, default=0.0)
    is_captive = Column(Boolean, default=False)
    analyzed_at = Column(DateTime, default=datetime.utcnow)
