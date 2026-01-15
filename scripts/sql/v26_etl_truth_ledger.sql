-- scripts/sql/v26_etl_truth_ledger.sql
-- Forensic Truth Ledger for ETL v26
-- Implements Axiom 8 (Law of Derived ETL State)

CREATE SCHEMA IF NOT EXISTS truth;

CREATE TABLE IF NOT EXISTS truth.etl_state_decisions (
    id BIGSERIAL PRIMARY KEY,
    decision_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,

    -- States
    previous_state VARCHAR(50),
    derived_state VARCHAR(50) NOT NULL,

    -- Evidence and Cryptographic Proof
    evidence_hash CHAR(64) NOT NULL, -- SHA256 of Canonical Fact Set
    evidence_summary JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Arbiter Meta
    arbiter_version VARCHAR(20) NOT NULL,
    derivation_algorithm VARCHAR(50) NOT NULL,
    violations_detected JSONB,

    -- Hash Chain (Blockchain-lite)
    previous_decision_hash CHAR(64),
    decision_hash CHAR(64) NOT NULL UNIQUE,

    -- Audit
    derived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    derived_by VARCHAR(100) NOT NULL,

    -- Chain Link
    CONSTRAINT fk_previous_hash FOREIGN KEY (previous_decision_hash)
        REFERENCES truth.etl_state_decisions(decision_hash)
);

CREATE INDEX IF NOT EXISTS idx_etl_job_chain ON truth.etl_state_decisions (job_id, derived_at);

-- Verification View
CREATE OR REPLACE VIEW truth.etl_audit_trail AS
WITH decision_chain AS (
    SELECT
        id,
        decision_id,
        job_id,
        derived_state,
        evidence_hash,
        decision_hash,
        previous_decision_hash,
        confidence_score,
        derived_at,
        LAG(decision_hash) OVER (PARTITION BY job_id ORDER BY derived_at) as expected_prev
    FROM truth.etl_state_decisions
)
SELECT
    *,
    (previous_decision_hash IS NULL OR previous_decision_hash = expected_prev) as chain_valid
FROM decision_chain;
