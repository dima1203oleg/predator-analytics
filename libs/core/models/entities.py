"""
Core Domain Models
Shared SQLAlchemy entities for Predator Analytics
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid

# Import Base from shared database module
from ..database import Base

class User(Base):
    """
    Unified User model.
    Synced with gold.users in PostgreSQL.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(UUID(as_uuid=True), index=True, default=uuid.uuid4)
    username = Column(String(100), unique=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255))
    role = Column(String(50), default="user")
    subscription_level = Column(String(50), default="free")
    can_view_pii = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime)

class Company(Base):
    """Ukrainian company from EDR"""
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    edrpou = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(500), nullable=False)
    short_name = Column(String(200))
    status = Column(String(50))  # active, closed, in_liquidation

    # Registration info
    registration_date = Column(DateTime)
    address = Column(Text)

    # Classification
    kved = Column(String(10))  # Main activity code
    kved_name = Column(String(200))

    # Ownership
    founders = Column(JSON)  # List of founders
    authorized_capital = Column(Float)

    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    source = Column(String(50), default="edr")

    # Relationships
    tenders = relationship("Tender", back_populates="company")
    risk_assessments = relationship("RiskAssessment", back_populates="company")

    # Optimization Indexes
    __table_args__ = (
        Index('idx_companies_kved', 'kved'),
        Index('idx_companies_status', 'status'),
    )


class Tender(Base):
    """Prozorro tender"""
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(String(100), unique=True, index=True)
    title = Column(Text)
    description = Column(Text)
    status = Column(String(50))

    # Value
    amount = Column(Float)
    currency = Column(String(3), default="UAH")

    # Dates
    start_date = Column(DateTime)
    end_date = Column(DateTime)

    # Procuring entity
    procuring_entity_name = Column(String(500))
    procuring_entity_edrpou = Column(String(10))

    # Winner
    winner_edrpou = Column(String(10), ForeignKey("companies.edrpou"))
    winner_name = Column(String(500))

    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    raw_data = Column(JSON)

    # Relationships
    company = relationship("Company", back_populates="tenders")

    # Optimization Indexes
    __table_args__ = (
        Index('idx_tenders_amount', 'amount'),
        Index('idx_tenders_procuring_entity', 'procuring_entity_edrpou'),
        Index('idx_tenders_dates', 'start_date', 'end_date'),
    )


class RiskAssessment(Base):
    """Company risk assessment"""
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    company_edrpou = Column(String(10), ForeignKey("companies.edrpou"))

    # Risk scores
    overall_score = Column(Float)
    tax_risk = Column(Float)
    legal_risk = Column(Float)
    financial_risk = Column(Float)

    # Flags
    is_tax_debtor = Column(Boolean, default=False)
    has_court_cases = Column(Boolean, default=False)
    is_sanctioned = Column(Boolean, default=False)

    # Details
    risk_factors = Column(JSON)
    recommendations = Column(JSON)

    # Metadata
    assessed_at = Column(DateTime, server_default=func.now())
    valid_until = Column(DateTime)

    # Relationships
    company = relationship("Company", back_populates="risk_assessments")


class ExchangeRate(Base):
    """NBU exchange rates"""
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    currency_code = Column(String(3), index=True)
    currency_name = Column(String(100))
    rate = Column(Float)
    rate_date = Column(DateTime, index=True)
    created_at = Column(DateTime, server_default=func.now())


class IngestionLog(Base):
    """Data ingestion audit log"""
    __tablename__ = "ingestion_logs"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50))
    status = Column(String(20))
    records_total = Column(Integer)
    records_processed = Column(Integer)
    records_failed = Column(Integer)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    error_message = Column(Text)


class SearchAnalytics(Base):
    """Search query logs and performance metrics"""
    __tablename__ = "search_analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), index=True, nullable=True)
    query = Column(Text, nullable=False)
    search_mode = Column(String(20))  # text, hybrid, semantic
    results_count = Column(Integer)
    latency_ms = Column(Float)
    timestamp = Column(DateTime, server_default=func.now())
    selected_doc_id = Column(String(100), nullable=True)
    user_agent = Column(String(200), nullable=True)

    __table_args__ = (
        Index('idx_search_analytics_timestamp', 'timestamp'),
    )


# ============================================================================
# v22.0 PLATFORM CORE MODELS
# (Multi-Tenant System of Record)
# ============================================================================

class Document(Base):
    """
    Core document storage (System of Record).
    """
    __tablename__ = "documents"
    __table_args__ = (
        Index('idx_documents_created_at', 'created_at'),
        Index('idx_documents_source_type', 'source_type'),
        Index('idx_documents_tenant_id', 'tenant_id'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(Text)
    content = Column(Text)
    source_type = Column(String(30))
    meta = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    assets = relationship("MultimodalAsset", back_populates="document")



class AugmentedDataset(Base):
    """
    Synthetic/Augmented data for training.
    """
    __tablename__ = "augmented_datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    original_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    content = Column(Text)
    aug_type = Column(String(50))  # synonym/paraphrase/backtranslate
    created_at = Column(DateTime, server_default=func.now())


class MLDataset(Base):
    """
    Logical ML dataset definition (linked to DVC).
    """
    __tablename__ = "ml_datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(Text, nullable=False)
    dvc_path = Column(Text, nullable=False)
    size_rows = Column(Integer)
    tags = Column(ARRAY(Text)) # Requires Postgres
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    jobs = relationship("MLJob", back_populates="dataset")


class MLJob(Base):
    """
    Training/Fine-tuning Job Registry.
    """
    __tablename__ = "ml_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("ml_datasets.id"))
    target = Column(String(50)) # embeddings/reranker/classifier
    status = Column(String(30)) # queued/running/succeeded/failed
    metrics = Column(JSONB)
    model_ref = Column(Text)    # MLflow registry ref
    si_cycle_id = Column(UUID(as_uuid=True)) # Link to Self-Improve cycle
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    dataset = relationship("MLDataset", back_populates="jobs")

    __table_args__ = (
        Index('idx_ml_jobs_status', 'status'),
    )


class MultimodalAsset(Base):
    """
    Images, Audio, PDF Previews linked to docs.
    """
    __tablename__ = "multimodal_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    doc_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    asset_type = Column(String(20)) # image/pdf_preview/audio
    uri = Column(Text)
    embedding_version = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    document = relationship("Document", back_populates="assets")


class SICycle(Base):
    """
    Self-Improvement Loop iteration tracker.
    """
    __tablename__ = "si_cycles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    trigger_type = Column(String(50))
    diagnostic_ref = Column(Text)
    dataset_ref = Column(Text)
    mlflow_run_id = Column(Text)
    status = Column(String(30))
    created_at = Column(DateTime, server_default=func.now())


class GraphNode(Base):
    """
    Knowledge Graph Node (Entity).
    """
    __tablename__ = "graph_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(Text, nullable=False) # Name/Value of entity
    label = Column(String(50)) # PERSON, ORG, LOC, EVENT
    properties = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    __table_args__ = (
        Index('idx_graph_nodes_name_trgm', 'name', postgresql_using='gin', postgresql_ops={'name': 'gin_trgm_ops'}),
        Index('idx_graph_nodes_label', 'label'),
    )


class GraphEdge(Base):
    """
    Knowledge Graph Edge (Relationship).
    """
    __tablename__ = "graph_edges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("graph_nodes.id"), nullable=False)
    target_id = Column(UUID(as_uuid=True), ForeignKey("graph_nodes.id"), nullable=False)
    relation = Column(String(50)) # WORKS_AT, SIGNED, OWNED_BY
    weight = Column(Float, default=1.0)

    # Provenance - where did we find this link?
    doc_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))

    properties = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index('idx_graph_edges_source', 'source_id'),
        Index('idx_graph_edges_target', 'target_id'),
        Index('idx_graph_edges_relation', 'relation'),
    )

class TrinityAuditLog(Base):
    """
    Audit log for Triple Agent (Trinity) operations.
    Keeps track of Gemini's plan, Mistral's output, and Copilot's audit.
    """
    __tablename__ = "trinity_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_text = Column(Text, nullable=False)
    user_id = Column(String(100), index=True)

    # Reasoning Chain
    intent = Column(String(50))
    gemini_plan = Column(JSONB)
    mistral_output = Column(Text)
    copilot_audit = Column(JSONB)

    # Final Outcome
    status = Column(String(20)) # verified, fixed, error
    final_output = Column(Text)
    risk_level = Column(String(20))

    # Metadata
    execution_time_ms = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())

class FileRegistry(Base):
    """
    Registry for uploaded files.
    Used by the ingestion pipeline.
    """
    __tablename__ = "file_registry"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    content_hash = Column(String(64), index=True, nullable=False) # For idempotency
    storage_path = Column(Text, nullable=False)
    mime_type = Column(String(100))
    tenant_id = Column(UUID(as_uuid=True), index=True, nullable=False)

    status = Column(String(20), default="PENDING") # PENDING, PROCESSING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)

    metadata_json = Column(JSONB, default={})

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
