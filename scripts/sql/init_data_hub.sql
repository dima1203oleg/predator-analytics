-- Predator v25 Data Hub Tables (Corrected)
BEGIN;

CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source_type VARCHAR(50) NOT NULL,
    config JSON,
    meta JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'uploaded',
    file_path VARCHAR(500),
    file_size INTEGER,
    file_type VARCHAR(50),
    row_count INTEGER,
    schema_info JSON,
    processing_log JSON,
    quality_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES datasets(id),
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSON,
    parameters JSON,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    progress FLOAT DEFAULT 0.0,
    result JSON,
    error_message TEXT,
    logs JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES datasets(id),
    name VARCHAR(255) NOT NULL,
    index_type VARCHAR(50) NOT NULL,
    config JSON,
    vector_dimension INTEGER,
    document_count INTEGER DEFAULT 0,
    index_size INTEGER,
    last_updated TIMESTAMP,
    is_healthy BOOLEAN DEFAULT TRUE,
    health_check JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    artifact_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    storage_path VARCHAR(500),
    storage_type VARCHAR(50) DEFAULT 'minio',
    file_size INTEGER,
    file_hash VARCHAR(64),
    meta JSON,
    version VARCHAR(50),
    tags JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMIT;
