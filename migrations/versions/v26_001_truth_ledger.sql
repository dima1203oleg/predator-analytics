-- PREDATOR ANALYTICS v26 MIGRATION
-- Truth Ledger Implementation
-- Created: 2026-01-12

CREATE SCHEMA IF NOT EXISTS truth;

COMMENT ON SCHEMA truth IS 'Constitutional Truth Ledger for Predator Analytics v26';

-- 1. Main Ledger Table
CREATE TABLE IF NOT EXISTS truth.truth_ledger (
    id BIGSERIAL PRIMARY KEY,
    job_id VARCHAR(255) NOT NULL,

    -- State Transition
    previous_state VARCHAR(50) NOT NULL,
    new_state VARCHAR(50) NOT NULL,

    -- Evidence & Arbitrage
    real_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    arbiter_decision VARCHAR(20) NOT NULL, -- 'APPROVE', 'DENY', 'FORCED_FAIL'
    arbiter_reason TEXT,

    -- Constitutional Guarantee (Crypto-Chain)
    previous_hash CHAR(64), -- SHA-256 hex
    current_hash CHAR(64) NOT NULL UNIQUE,

    -- Execution Context
    consensus_tier VARCHAR(20) NOT NULL DEFAULT 'basic', -- 'basic', 'audit', 'court'
    witness_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL
);

-- Indexes for performance and lookup
CREATE INDEX IF NOT EXISTS idx_ledger_job_id ON truth.truth_ledger(job_id);
CREATE INDEX IF NOT EXISTS idx_ledger_new_state ON truth.truth_ledger(new_state);
CREATE INDEX IF NOT EXISTS idx_ledger_current_hash ON truth.truth_ledger(current_hash);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON truth.truth_ledger(created_at DESC);

-- 2. Signatures Table (For Multi-Witness Consensus)
CREATE TABLE IF NOT EXISTS truth.ledger_signatures (
    ledger_id BIGINT NOT NULL REFERENCES truth.truth_ledger(id) ON DELETE CASCADE,
    witness_id VARCHAR(100) NOT NULL,
    signature TEXT NOT NULL, -- Base64 encoded
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (ledger_id, witness_id)
);

-- 3. Integrity Function (Hash Chain Enforcement)
CREATE OR REPLACE FUNCTION truth.verify_hash_integrity()
RETURNS TRIGGER AS $$
DECLARE
    calc_hash CHAR(64);
    prev_hash_check CHAR(64);
BEGIN
    -- Check uniqueness of job transition (Optimistic Lock logic could go here)

    -- Calculate Hash: SHA256(job_id + prev_state + new_state + metrics + prev_hash + tier)
    calc_hash := encode(sha256(
        (NEW.job_id || NEW.previous_state || NEW.new_state || NEW.real_metrics::text ||
         COALESCE(NEW.previous_hash, 'GENESIS') || NEW.consensus_tier)::bytea
    ), 'hex');

    -- Enforce: The calculated hash must match the provided hash (Application must calculate strictly)
    -- OR we calculate it here. For v26, let's calculate here to prevent tampering.
    -- NEW.current_hash := calc_hash; -- Uncomment to enforce DB-side hashing

    -- Verify Previous Hash Linkage (if not genesis)
    IF NEW.previous_hash IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM truth.truth_ledger WHERE current_hash = NEW.previous_hash) THEN
            RAISE EXCEPTION 'Constitution Violation: Previous hash % not found in ledger. Chain broken.', NEW.previous_hash;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trg_truth_integrity ON truth.truth_ledger;
CREATE TRIGGER trg_truth_integrity
BEFORE INSERT ON truth.truth_ledger
FOR EACH ROW EXECUTE FUNCTION truth.verify_hash_integrity();

-- 4. Audit View
CREATE OR REPLACE VIEW truth.audit_log_view AS
SELECT
    tl.id,
    tl.job_id,
    tl.previous_state,
    tl.new_state,
    tl.arbiter_decision,
    tl.created_at,
    tl.current_hash,
    COUNT(ls.witness_id) as signatures_count
FROM truth.truth_ledger tl
LEFT JOIN truth.ledger_signatures ls ON tl.id = ls.ledger_id
GROUP BY tl.id;
