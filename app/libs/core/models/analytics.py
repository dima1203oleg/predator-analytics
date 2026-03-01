"""Predator Analytics v45 - Analytical Layer Models
Models for Behavioral, Institutional, and Influence layers.
"""

from datetime import datetime
import uuid

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.libs.core.database import Base


class BehavioralProfile(Base):
    """Layer 1: Behavioral (101-120)
    Stores the 'psychological' profile of an entity (Importer/Company).
    """

    __tablename__ = "behavioral_profiles"
    __table_args__ = {"schema": "gold"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), index=True, nullable=False)  # Refers to Company.id or User.id
    entity_type = Column(String(50), nullable=False)  # 'company', 'broker'

    # Behavioral Metrics
    memory_score = Column(Float, default=0.0)  # 101: Importer with memory
    stress_reaction_index = Column(Float, default=0.0)  # 102: Reaction to stress
    temperature = Column(Float, default=0.0)  # 103: Behavioral temperature
    pulse_stability = Column(Float, default=0.0)  # 104: Economic pulse
    maturity_stage = Column(String(50), default="newborn")  # 105: Sudden maturity

    # Advanced Attributes
    vulnerability_score = Column(Float, default=0.0)
    compliance_honesty_rate = Column(Float, default=1.0)

    # Metadata
    last_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    historical_patterns = Column(JSONB, default={})  # 101/106: pattern shifts


class InstitutionalBias(Base):
    """Layer 2: Institutional (121-140)
    Stores metrics about state infrastructure (Customs Posts, Officials).
    """

    __tablename__ = "institutional_biases"
    __table_args__ = {"schema": "gold"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(String(255), index=True, nullable=False)  # e.g., 'customs_post_001'
    institution_type = Column(String(50), nullable=False)  # 'customs', 'licensing', 'tax'

    # Metrics
    permeability_score = Column(Float, default=1.0)  # How 'easy' it is to pass
    loyalty_index = Column(Float, default=0.0)  # 123: Loyalty to specific groups
    turbulence_rate = Column(Float, default=0.0)  # 126/129: Admin turbulence
    asymmetry_coefficient = Column(Float, default=1.0)  # 121: Unevenness of permissions

    # Tracking
    active_monopolies = Column(JSONB, default=[])  # 125/132: Concentration labels
    last_reconciliation = Column(DateTime, default=datetime.utcnow)


class InfluenceGraph(Base):
    """Layer 3: Influence (141-160)
    Stores node-to-node influence weights.
    """

    __tablename__ = "influence_nodes"
    __table_args__ = {"schema": "gold"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), index=True)
    target_id = Column(UUID(as_uuid=True), index=True)
    connection_type = Column(String(50), nullable=False)  # 'lobbying', 'ownership', 'synchronicity'

    gravity_weight = Column(Float, default=1.0)  # 141: Gravitational center
    latent_signal_strength = Column(Float, default=0.0)  # 143: Latent alliance strength

    is_shadow = Column(Boolean, default=False)  # 142: Shadow cluster indicator
    detected_at = Column(DateTime, default=datetime.utcnow)


class PredictiveAlert(Base):
    """Layer 5: Predictive (181-200)
    Stores generated alerts from the Predictive Scenario Engine.
    """

    __tablename__ = "predictive_alerts"
    __table_args__ = {"schema": "gold"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    predictive_type = Column(String(100), nullable=False)  # 'disappearance', 'price_spike', 'sanction'
    probability = Column(Float, nullable=False)  # 0.0 - 1.0

    entity_id = Column(UUID(as_uuid=True), index=True)
    description = Column(String(1000))

    status = Column(String(50), default="active")  # 'active', 'suppressed', 'confirmed'
    created_at = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime)


class StructuralAnomaly(Base):
    """Layer 4: Structural Blind Spots (161-180)
    Identifies 'missing' economic activity or 'phantom' flows.
    """

    __tablename__ = "structural_anomalies"
    __table_args__ = {"schema": "gold"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anomaly_type = Column(String(100), nullable=False)  # 'import_without_market', 'demand_without_import'
    region = Column(String(100), index=True)  # 166: Regional economy without explanation
    uctzed_code = Column(String(20), index=True)  # 161: Commodity code

    gap_magnitude = Column(Float, default=0.0)  # Calculated 'missing' volume/value
    confidence_level = Column(Float, default=0.0)

    suspected_sources = Column(JSONB, default=[])  # 162: Hidden supply sources
    detected_at = Column(DateTime, default=datetime.utcnow)
    description = Column(String(1000))


class MarketPulse(Base):
    """Layer 5: Composite Health (200)
    Stores historical snapshots of the market pulse.
    """

    __tablename__ = "market_pulses"
    __table_args__ = {"schema": "gold"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    turbulence_index = Column(Float, default=0.0)  # 0.0 - 1.0
    system_health = Column(String(50), default="stable")
    active_anomalies = Column(Integer, default=0)

    # Aggregated metrics for easy plotting
    behavioral_score = Column(Float, default=0.0)
    institutional_score = Column(Float, default=0.0)
    structural_score = Column(Float, default=0.0)

    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class DecisionArtifact(Base):
    """Decision Ledger: Immutable log for AI decisions.
    Ensures that any critical decision (like CERS > High Alert) is mathematically signed
    and cannot be altered without breaking the hash.
    """

    __tablename__ = "decision_artifacts"
    __table_args__ = {"schema": "gold"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(255), nullable=True)  # If multi-tenant
    trace_id = Column(String(64), nullable=False, index=True)  # UUID or string tracking the context
    decision_type = Column(String(50), nullable=False)  # e.g., 'CERS_CALCULATION', 'PREDICTIVE_ALERT_FIRED'

    # Payload
    input_context_hash = Column(String(64), nullable=False)  # SHA-256 of the inputs
    model_version_hash = Column(String(64), nullable=True)  # Which weights were used
    output_payload = Column(JSONB, nullable=False)  # The actual decision data
    confidence_score = Column(Float, default=1.0)  # 0.0 - 1.0

    # Audit
    signature_hash = Column(
        String(64), nullable=False, index=True
    )  # SHA-256(trace_id + type + input_hash + output + timestamp)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
