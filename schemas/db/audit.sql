
-- Predator Analytics v25.1
-- Database Schema: Audit Ledger (Partitioned)

CREATE TABLE IF NOT EXISTS audit_ledger (
    audit_id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actor_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    resource_id TEXT,
    payload JSONB,
    trace_id UUID,
    integrity_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_ledger (timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trace ON audit_ledger (trace_id);
