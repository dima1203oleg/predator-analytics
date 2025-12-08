"""
Predator Analytics - Data Layer Architecture
PostgreSQL Schema for System of Record (Single Source of Truth)

Based on architecture:
- PostgreSQL/Timescale — джерело правди + транзакційна цілісність + метадані
- OpenSearch — швидкий full-text + агрегації + аналітика запитів
- Qdrant — семантика/вектори/мультимодал
- Redis — швидкість, кеш, короткі стани
- MinIO — data lake для файлів/артефактів/бекапів/ML
"""

# PostgreSQL Schema Migrations
SCHEMA_VERSION = "2.0.0"

CREATE_SCHEMAS = """
-- Core schemas
CREATE SCHEMA IF NOT EXISTS raw;           -- ETL staging
CREATE SCHEMA IF NOT EXISTS gold;          -- Normalized business data
CREATE SCHEMA IF NOT EXISTS ml;            -- ML datasets and jobs
CREATE SCHEMA IF NOT EXISTS audit;         -- Security and compliance
CREATE SCHEMA IF NOT EXISTS config;        -- System configuration
"""

CREATE_CORE_TABLES = """
-- =====================================================
-- DOCUMENTS (Gold Layer - Single Source of Truth)
-- =====================================================
CREATE TABLE IF NOT EXISTS gold.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_type VARCHAR(50) NOT NULL,  -- 'tender', 'company', 'court_decision', 'customs', etc.
    source_id VARCHAR(100) NOT NULL,  -- prozorro, edr, customs, court
    external_id VARCHAR(255) NOT NULL,  -- ID from source system
    
    -- Core data
    title TEXT,
    content TEXT,
    content_html TEXT,
    summary TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'pending',  -- pending, indexed, failed
    embedding_version VARCHAR(50),  -- e.g., 'all-MiniLM-L6-v2-v1'
    
    -- Timestamps
    source_created_at TIMESTAMPTZ,
    source_updated_at TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    indexed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(source_id, external_id)
);

CREATE INDEX idx_documents_source ON gold.documents(source_id);
CREATE INDEX idx_documents_type ON gold.documents(doc_type);
CREATE INDEX idx_documents_status ON gold.documents(processing_status);
CREATE INDEX idx_documents_tags ON gold.documents USING GIN(tags);
CREATE INDEX idx_documents_metadata ON gold.documents USING GIN(metadata);

-- =====================================================
-- RAW DATA (Staging Layer)
-- =====================================================
CREATE TABLE IF NOT EXISTS raw.staging_generic (
    id BIGSERIAL PRIMARY KEY,
    source_id VARCHAR(100) NOT NULL,
    batch_id VARCHAR(100),
    raw_data JSONB NOT NULL,
    raw_text TEXT,
    
    status VARCHAR(20) DEFAULT 'pending',  -- pending, processed, failed
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_staging_source ON raw.staging_generic(source_id);
CREATE INDEX idx_staging_status ON raw.staging_generic(status);
CREATE INDEX idx_staging_batch ON raw.staging_generic(batch_id);

-- =====================================================
-- CUSTOMS DATA (Ukrainian Customs Declarations)
-- =====================================================
CREATE TABLE IF NOT EXISTS gold.customs_imports (
    id BIGSERIAL PRIMARY KEY,
    declaration_number VARCHAR(100),
    declaration_date DATE,
    
    -- Importer
    importer_edrpou VARCHAR(20),
    importer_name TEXT,
    importer_country VARCHAR(3),
    
    -- Exporter
    exporter_name TEXT,
    exporter_country VARCHAR(3),
    
    -- Goods
    goods_code VARCHAR(20),  -- HS code
    goods_description TEXT,
    quantity DECIMAL(15,4),
    quantity_unit VARCHAR(20),
    
    -- Values
    invoice_value DECIMAL(15,2),
    invoice_currency VARCHAR(3),
    customs_value_uah DECIMAL(15,2),
    weight_net DECIMAL(15,4),
    weight_gross DECIMAL(15,4),
    
    -- Customs
    customs_office VARCHAR(20),
    regime VARCHAR(50),
    
    -- Metadata
    source_file VARCHAR(255),
    raw_data JSONB,
    
    -- Timestamps
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Document reference
    document_id UUID REFERENCES gold.documents(id)
);

CREATE INDEX idx_customs_edrpou ON gold.customs_imports(importer_edrpou);
CREATE INDEX idx_customs_date ON gold.customs_imports(declaration_date);
CREATE INDEX idx_customs_goods_code ON gold.customs_imports(goods_code);
CREATE INDEX idx_customs_country ON gold.customs_imports(exporter_country);

-- =====================================================
-- COMPANIES (Ukrainian Business Registry - ЄДР)
-- =====================================================
CREATE TABLE IF NOT EXISTS gold.companies (
    id BIGSERIAL PRIMARY KEY,
    edrpou VARCHAR(20) UNIQUE NOT NULL,
    
    -- Names
    full_name TEXT NOT NULL,
    short_name TEXT,
    name_en TEXT,
    
    -- Status
    status VARCHAR(50),  -- active, in_liquidation, liquidated
    registration_date DATE,
    
    -- Address
    region VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    postal_code VARCHAR(10),
    
    -- Classification
    kved_main VARCHAR(20),  -- NACE code
    kved_list TEXT[],
    legal_form VARCHAR(100),
    
    -- Contacts
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Owners/Directors
    director_name TEXT,
    founders JSONB,  -- List of founders with shares
    authorized_capital DECIMAL(15,2),
    
    -- Sanctions/Risks
    is_sanctioned BOOLEAN DEFAULT FALSE,
    risk_score INTEGER,
    
    -- Metadata
    raw_data JSONB,
    source_url TEXT,
    
    -- Timestamps
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Document reference
    document_id UUID REFERENCES gold.documents(id)
);

CREATE INDEX idx_companies_name ON gold.companies USING GIN(to_tsvector('ukrainian', full_name));
CREATE INDEX idx_companies_status ON gold.companies(status);
CREATE INDEX idx_companies_region ON gold.companies(region);
CREATE INDEX idx_companies_kved ON gold.companies(kved_main);

-- =====================================================
-- TENDERS (Prozorro Public Procurement)
-- =====================================================
CREATE TABLE IF NOT EXISTS gold.tenders (
    id BIGSERIAL PRIMARY KEY,
    tender_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Basic info
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50),  -- active, complete, cancelled, unsuccessful
    procurement_method VARCHAR(50),
    procurement_method_type VARCHAR(50),
    
    -- Procuring entity
    procuring_entity_edrpou VARCHAR(20),
    procuring_entity_name TEXT,
    
    -- Values
    expected_value DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'UAH',
    
    -- Dates
    tender_start TIMESTAMPTZ,
    tender_end TIMESTAMPTZ,
    auction_date TIMESTAMPTZ,
    
    -- Classification
    cpv_code VARCHAR(20),
    cpv_description TEXT,
    
    -- Winner
    winner_edrpou VARCHAR(20),
    winner_name TEXT,
    contract_value DECIMAL(15,2),
    
    -- Metadata
    source_url TEXT,
    raw_data JSONB,
    
    -- Timestamps
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Document reference
    document_id UUID REFERENCES gold.documents(id)
);

CREATE INDEX idx_tenders_status ON gold.tenders(status);
CREATE INDEX idx_tenders_procuring ON gold.tenders(procuring_entity_edrpou);
CREATE INDEX idx_tenders_winner ON gold.tenders(winner_edrpou);
CREATE INDEX idx_tenders_cpv ON gold.tenders(cpv_code);
CREATE INDEX idx_tenders_dates ON gold.tenders(tender_start, tender_end);

-- =====================================================
-- ML DATASETS (DVC References)
-- =====================================================
CREATE TABLE IF NOT EXISTS ml.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    
    -- Type
    dataset_type VARCHAR(50),  -- training, evaluation, augmented
    task VARCHAR(50),  -- search_quality, entity_extraction, classification
    
    -- Storage
    dvc_hash VARCHAR(100),
    minio_path TEXT,
    file_format VARCHAR(20),  -- parquet, jsonl, csv
    
    -- Stats
    row_count INTEGER,
    size_bytes BIGINT,
    
    -- Metadata
    description TEXT,
    tags TEXT[],
    config JSONB,
    
    -- Provenance
    source_query TEXT,
    created_by VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(name, version)
);

-- =====================================================
-- ML JOBS (Training/Inference)
-- =====================================================
CREATE TABLE IF NOT EXISTS ml.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,  -- training, inference, evaluation, reindex
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',  -- pending, running, completed, failed
    progress INTEGER DEFAULT 0,
    
    -- Config
    model_name VARCHAR(255),
    dataset_id UUID REFERENCES ml.datasets(id),
    config JSONB,
    
    -- Results
    metrics JSONB,
    artifacts JSONB,  -- paths to MinIO
    error_message TEXT,
    
    -- MLflow integration
    mlflow_run_id VARCHAR(100),
    mlflow_experiment_id VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Contour
    contour VARCHAR(20) DEFAULT 'dev'  -- dev, edge, compute
);

CREATE INDEX idx_ml_jobs_status ON ml.jobs(status);
CREATE INDEX idx_ml_jobs_type ON ml.jobs(job_type);

-- =====================================================
-- SEARCH FEEDBACK (Self-Improvement Loop)
-- =====================================================
CREATE TABLE IF NOT EXISTS gold.search_feedback (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    
    -- Query
    query_text TEXT NOT NULL,
    query_embedding_version VARCHAR(50),
    
    -- Results
    result_ids TEXT[],
    clicked_ids TEXT[],
    dwell_times INTEGER[],  -- seconds per result
    
    -- Feedback
    rating INTEGER,  -- 1-5
    feedback_type VARCHAR(20),  -- thumbs_up, thumbs_down, explicit
    feedback_text TEXT,
    
    -- Context
    user_id VARCHAR(100),
    user_segment VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_session ON gold.search_feedback(session_id);
CREATE INDEX idx_feedback_date ON gold.search_feedback(created_at);

-- =====================================================
-- REINDEX PLANS (Versioned Vector Collections)
-- =====================================================
CREATE TABLE IF NOT EXISTS ml.reindex_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plan
    name VARCHAR(255) NOT NULL,
    embedding_model VARCHAR(100),
    target_collection VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Config
    config JSONB,
    minio_plan_path TEXT,  -- reindex_plan.yaml in MinIO
    
    -- Stats
    documents_total INTEGER,
    documents_processed INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- POLICY EVENTS (Automated Decisions)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit.policy_events (
    id BIGSERIAL PRIMARY KEY,
    
    policy_name VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(50),  -- metric_threshold, schedule, manual
    
    -- Decision
    action VARCHAR(100),
    action_params JSONB,
    result VARCHAR(20),  -- approved, rejected, deferred
    
    -- Context
    metrics_snapshot JSONB,
    reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

-- =====================================================
-- TIMESERIES TABLES (For TimescaleDB if enabled)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit.metrics_history (
    time TIMESTAMPTZ NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DOUBLE PRECISION,
    tags JSONB,
    contour VARCHAR(20)
);

-- Uncomment if using TimescaleDB:
-- SELECT create_hypertable('audit.metrics_history', 'time', if_not_exists => TRUE);

CREATE INDEX idx_metrics_name ON audit.metrics_history(metric_name, time DESC);
"""

# Naming Conventions
NAMING_CONVENTIONS = {
    "postgresql": {
        "schemas": ["raw", "gold", "ml", "audit", "config"],
        "tables": "{schema}.{entity}_{suffix}",  # e.g., gold.customs_imports
        "indexes": "idx_{table}_{column}",
        "constraints": "{table}_{type}_{columns}"  # e.g., documents_pk_id
    },
    "opensearch": {
        "indices": "{entity}-v{version}",  # e.g., documents-v1, customs-v1
        "aliases": "{entity}-current",  # points to latest version
        "logs": "logs-{service}-{date}",  # e.g., logs-backend-2025.12.08
        "metrics": "metrics-{type}-{date}"  # e.g., metrics-search-2025.12
    },
    "qdrant": {
        "collections": "{entity}_vectors_v{version}",  # e.g., documents_vectors_v2
        "snapshot": "{collection}_{date}"  # for backups
    },
    "minio": {
        "buckets": {
            "raw-data": "Raw ETL input files",
            "raw-imports": "Uploaded files",
            "datasets": "ML training datasets (DVC)",
            "models": "Trained models",
            "exports": "User exports",
            "mlflow": "MLflow artifacts",
            "snapshots": "Database snapshots",
            "reindex-plans": "Reindex configurations"
        }
    },
    "redis": {
        "keys": {
            "cache": "cache:{type}:{id}",
            "session": "session:{user_id}",
            "rate": "rate:{ip}:{endpoint}",
            "feature": "feature:{name}",
            "lock": "lock:{resource}"
        },
        "ttl": {
            "cache_search": 300,  # 5 min
            "cache_embedding": 3600,  # 1 hour
            "session": 86400,  # 24 hours
            "rate_limit": 60  # 1 min
        }
    }
}

# Environment Configuration
ENV_CONFIGS = {
    "dev": {
        "description": "MacBook Development",
        "postgresql": {"host": "localhost", "replicas": 0},
        "opensearch": {"nodes": 1, "shards": 1, "replicas": 0},
        "qdrant": {"nodes": 1},
        "redis": {"cluster": False},
        "minio": {"nodes": 1},
        "features": {
            "heavy_ml": False,
            "full_reindex": False,
            "mock_signals": True
        }
    },
    "edge": {
        "description": "Oracle Cloud Staging",
        "postgresql": {"host": "oracle-pg", "replicas": 1},
        "opensearch": {"nodes": 2, "shards": 2, "replicas": 1},
        "qdrant": {"nodes": 2},
        "redis": {"cluster": True, "nodes": 3},
        "minio": {"nodes": 2},
        "features": {
            "heavy_ml": False,
            "full_reindex": True,
            "canary_indices": True
        }
    },
    "compute": {
        "description": "NVIDIA GPU Server",
        "postgresql": {"host": "nvidia-pg", "replicas": 0},  # Read from edge
        "opensearch": {"nodes": 0},  # Use edge
        "qdrant": {"nodes": 1},  # Local for fast inference
        "redis": {"cluster": False},  # Local cache
        "minio": {"nodes": 0},  # Use edge
        "features": {
            "heavy_ml": True,
            "gpu_inference": True,
            "batch_embeddings": True,
            "fine_tuning": True
        }
    }
}

# Data Quality Gates
QUALITY_GATES = {
    "etl": {
        "min_completeness": 0.95,  # 95% non-null required fields
        "max_duplicates": 0.01,  # 1% max duplicates
        "schema_match": True
    },
    "search": {
        "ndcg_threshold": 0.7,
        "mrr_threshold": 0.6,
        "latency_p95_ms": 500
    },
    "ml": {
        "min_dataset_size": 1000,
        "test_split": 0.2,
        "validation_split": 0.1
    }
}

if __name__ == "__main__":
    print("=== Predator Analytics Data Layer Schema ===")
    print(f"Version: {SCHEMA_VERSION}")
    print("\nSchemas:")
    for schema in NAMING_CONVENTIONS["postgresql"]["schemas"]:
        print(f"  - {schema}")
    print("\nEnvironments:")
    for env, config in ENV_CONFIGS.items():
        print(f"  - {env}: {config['description']}")
