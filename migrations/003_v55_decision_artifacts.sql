-- Predator Analytics v55.0 — Decision Artifacts (WORM table)
-- Spec 3.3: Immutable record of every AI decision. Retention 7+ years.
-- UPDATE and DELETE are forbidden via trigger.

BEGIN;

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS v55;

-- ═══════════════════════════════════════════════════════════════
-- Decision Artifacts table (WORM: Write-Once-Read-Many)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS v55.decision_artifacts (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_id VARCHAR(100),
    trace_id VARCHAR(100),
    decision_type VARCHAR(100) NOT NULL,
    input_fingerprint VARCHAR(64) NOT NULL,   -- SHA-256
    model_fingerprint VARCHAR(64),
    output_fingerprint VARCHAR(64) NOT NULL,
    confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    explanation JSONB,
    sources JSONB,
    metadata JSONB DEFAULT '{}'
);

-- WORM trigger: forbid UPDATE and DELETE
CREATE OR REPLACE FUNCTION v55.prevent_modify_decision_artifacts()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Decision artifacts are immutable (WORM). UPDATE/DELETE заборонено.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_no_update_decision_artifacts ON v55.decision_artifacts;
CREATE TRIGGER trg_no_update_decision_artifacts
    BEFORE UPDATE OR DELETE ON v55.decision_artifacts
    FOR EACH ROW EXECUTE FUNCTION v55.prevent_modify_decision_artifacts();

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_da_timestamp ON v55.decision_artifacts (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_da_decision_type ON v55.decision_artifacts (decision_type);
CREATE INDEX IF NOT EXISTS idx_da_trace_id ON v55.decision_artifacts (trace_id) WHERE trace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_da_tenant_id ON v55.decision_artifacts (tenant_id) WHERE tenant_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- UEID Entity Registry
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS v55.entities (
    ueid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    name_normalized TEXT NOT NULL,
    edrpou VARCHAR(10),
    inn VARCHAR(12),
    fingerprint VARCHAR(64) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_edrpou ON v55.entities (edrpou) WHERE edrpou IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entities_name_normalized ON v55.entities USING gin (name_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_entities_fingerprint ON v55.entities (fingerprint);
CREATE INDEX IF NOT EXISTS idx_entities_type ON v55.entities (entity_type);

-- ═══════════════════════════════════════════════════════════════
-- CERS Scores (history)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS v55.cers_scores (
    id BIGSERIAL PRIMARY KEY,
    ueid UUID NOT NULL REFERENCES v55.entities(ueid),
    score FLOAT NOT NULL CHECK (score >= 0 AND score <= 100),
    level VARCHAR(20) NOT NULL,
    components JSONB NOT NULL,
    weights JSONB NOT NULL,
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    decorrelation_applied BOOLEAN DEFAULT FALSE,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cers_ueid ON v55.cers_scores (ueid, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cers_level ON v55.cers_scores (level);

-- ═══════════════════════════════════════════════════════════════
-- Signals
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS v55.signals (
    signal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_type VARCHAR(50) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    ueid UUID REFERENCES v55.entities(ueid),
    layer VARCHAR(50) NOT NULL,
    score FLOAT CHECK (score >= 0 AND score <= 100),
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    summary TEXT,
    details JSONB DEFAULT '{}',
    sources JSONB DEFAULT '[]',
    trace_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signals_ueid ON v55.signals (ueid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_layer ON v55.signals (layer);
CREATE INDEX IF NOT EXISTS idx_signals_type ON v55.signals (signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_created ON v55.signals (created_at DESC);

-- Enable pg_trgm extension for fuzzy name matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMIT;
