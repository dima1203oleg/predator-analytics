-- Predator Analytics Data Layer v2.0.0
-- Generated from ua-sources/app/core/data_layer_schema.py
-- Creates schemas and core tables to align DB with SoR design.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Schemas
CREATE SCHEMA IF NOT EXISTS raw;           -- ETL staging
CREATE SCHEMA IF NOT EXISTS gold;          -- Normalized business data
CREATE SCHEMA IF NOT EXISTS ml;            -- ML datasets and jobs
CREATE SCHEMA IF NOT EXISTS audit;         -- Security and compliance
CREATE SCHEMA IF NOT EXISTS config;        -- System configuration

-- =====================================================
-- DOCUMENTS (Gold Layer - Single Source of Truth)
-- =====================================================
CREATE TABLE IF NOT EXISTS gold.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    title TEXT,
    content TEXT,
    content_html TEXT,
    summary TEXT,
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    processing_status VARCHAR(20) DEFAULT 'pending',
    embedding_version VARCHAR(50),
    source_created_at TIMESTAMPTZ,
    source_updated_at TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    indexed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_documents_source ON gold.documents(source_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON gold.documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON gold.documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON gold.documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON gold.documents USING GIN(metadata);

-- =====================================================
-- RAW DATA (Staging Layer)
-- =====================================================
CREATE TABLE IF NOT EXISTS raw.staging_generic (
    id BIGSERIAL PRIMARY KEY,
    source_id VARCHAR(100) NOT NULL,
    batch_id VARCHAR(100),
    raw_data JSONB NOT NULL,
    raw_text TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_staging_source ON raw.staging_generic(source_id);
CREATE INDEX IF NOT EXISTS idx_staging_status ON raw.staging_generic(status);
CREATE INDEX IF NOT EXISTS idx_staging_batch ON raw.staging_generic(batch_id);

-- =====================================================
-- CUSTOMS DATA (Ukrainian Customs Declarations)
-- =====================================================
CREATE TABLE IF NOT EXISTS gold.customs_imports (
    id BIGSERIAL PRIMARY KEY,
    declaration_number VARCHAR(100),
    declaration_date DATE,
    importer_edrpou VARCHAR(20),
    importer_name TEXT,
    importer_country VARCHAR(3),
    exporter_name TEXT,
    exporter_country VARCHAR(3),
    goods_code VARCHAR(20),
    goods_description TEXT,
    quantity DECIMAL(15,4),
    quantity_unit VARCHAR(20),
    invoice_value DECIMAL(15,2),
    invoice_currency VARCHAR(3),
    customs_value_uah DECIMAL(15,2),
    weight_net DECIMAL(15,4),
    weight_gross DECIMAL(15,4),
    customs_office VARCHAR(20),
    regime VARCHAR(50),
    source_file VARCHAR(255),
    raw_data JSONB,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    document_id UUID REFERENCES gold.documents(id)
);
CREATE INDEX IF NOT EXISTS idx_customs_edrpou ON gold.customs_imports(importer_edrpou);
CREATE INDEX IF NOT EXISTS idx_customs_date ON gold.customs_imports(declaration_date);
CREATE INDEX IF NOT EXISTS idx_customs_goods_code ON gold.customs_imports(goods_code);
CREATE INDEX IF NOT EXISTS idx_customs_country ON gold.customs_imports(exporter_country);

-- =====================================================
-- COMPANIES (ЄДР)
-- =====================================================
CREATE TABLE IF NOT EXISTS gold.companies (
    id BIGSERIAL PRIMARY KEY,
    edrpou VARCHAR(20) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    short_name TEXT,
    name_en TEXT,
    status VARCHAR(50),
    registration_date DATE,
    region VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    postal_code VARCHAR(10),
    kved_main VARCHAR(20),
    kved_list TEXT[],
    legal_form VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    director_name TEXT,
    founders JSONB,
    authorized_capital DECIMAL(15,2),
    is_sanctioned BOOLEAN DEFAULT FALSE,
    risk_score INTEGER,
    raw_data JSONB,
    source_url TEXT,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    document_id UUID REFERENCES gold.documents(id)
);
CREATE INDEX IF NOT EXISTS idx_companies_name ON gold.companies USING GIN(to_tsvector('ukrainian', full_name));
CREATE INDEX IF NOT EXISTS idx_companies_status ON gold.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_region ON gold.companies(region);
CREATE INDEX IF NOT EXISTS idx_companies_kved ON gold.companies(kved_main);

-- =====================================================
-- TENDERS (Prozorro)
-- =====================================================
CREATE TABLE IF NOT EXISTS gold.tenders (
    id BIGSERIAL PRIMARY KEY,
    tender_id VARCHAR(100) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50),
    procurement_method VARCHAR(50),
    procurement_method_type VARCHAR(50),
    procuring_entity_edrpou VARCHAR(20),
    procuring_entity_name TEXT,
    expected_value DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'UAH',
    tender_start TIMESTAMPTZ,
    tender_end TIMESTAMPTZ,
    auction_date TIMESTAMPTZ,
    cpv_code VARCHAR(20),
    cpv_description TEXT,
    winner_edrpou VARCHAR(20),
    winner_name TEXT,
    contract_value DECIMAL(15,2),
    source_url TEXT,
    raw_data JSONB,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    document_id UUID REFERENCES gold.documents(id)
);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON gold.tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_procuring ON gold.tenders(procuring_entity_edrpou);
CREATE INDEX IF NOT EXISTS idx_tenders_winner ON gold.tenders(winner_edrpou);
CREATE INDEX IF NOT EXISTS idx_tenders_cpv ON gold.tenders(cpv_code);
CREATE INDEX IF NOT EXISTS idx_tenders_dates ON gold.tenders(tender_start, tender_end);

-- =====================================================
-- ML DATASETS (DVC References)
-- =====================================================
CREATE TABLE IF NOT EXISTS ml.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    dataset_type VARCHAR(50),
    task VARCHAR(50),
    dvc_hash VARCHAR(100),
    minio_path TEXT,
    file_format VARCHAR(20),
    row_count INTEGER,
    size_bytes BIGINT,
    description TEXT,
    tags TEXT[],
    config JSONB,
    source_query TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, version)
);

-- =====================================================
-- ML JOBS (Training/Inference)
-- =====================================================
CREATE TABLE IF NOT EXISTS ml.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    model_name VARCHAR(255),
    dataset_id UUID REFERENCES ml.datasets(id),
    config JSONB,
    metrics JSONB,
    artifacts JSONB,
    error_message TEXT,
    mlflow_run_id VARCHAR(100),
    mlflow_experiment_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    contour VARCHAR(20) DEFAULT 'dev'
);
CREATE INDEX IF NOT EXISTS idx_ml_jobs_status ON ml.jobs(status);
CREATE INDEX IF NOT EXISTS idx_ml_jobs_type ON ml.jobs(job_type);

-- =====================================================
-- SEARCH FEEDBACK
-- =====================================================
CREATE TABLE IF NOT EXISTS gold.search_feedback (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    query_text TEXT NOT NULL,
    query_embedding_version VARCHAR(50),
    result_ids TEXT[],
    clicked_ids TEXT[],
    dwell_times INTEGER[],
    rating INTEGER,
    feedback_type VARCHAR(20),
    feedback_text TEXT,
    user_id VARCHAR(100),
    user_segment VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON gold.search_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_date ON gold.search_feedback(created_at);

-- =====================================================
-- REINDEX PLANS
-- =====================================================
CREATE TABLE IF NOT EXISTS ml.reindex_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    embedding_model VARCHAR(100),
    target_collection VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    config JSONB,
    minio_plan_path TEXT,
    documents_total INTEGER,
    documents_processed INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- POLICY EVENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS audit.policy_events (
    id BIGSERIAL PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(50),
    action VARCHAR(100),
    action_params JSONB,
    result VARCHAR(20),
    metrics_snapshot JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

-- =====================================================
-- TIMESERIES (for TimescaleDB; hypertable optional)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit.metrics_history (
    time TIMESTAMPTZ NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DOUBLE PRECISION,
    tags JSONB,
    contour VARCHAR(20)
);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON audit.metrics_history(metric_name, time DESC);

