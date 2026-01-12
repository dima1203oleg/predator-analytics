-- ═══════════════════════════════════════════════════════════════
-- AZR Amendment Tables for Truth Ledger
-- Predator Analytics v26
-- ═══════════════════════════════════════════════════════════════
--
-- CONSTITUTIONAL ENFORCEMENT:
-- These tables implement immutable records for AZR amendments.
-- Axiom 14 (Temporal Irreversibility) is enforced by hash chaining.
--
-- NO DELETION OR UPDATE OF HISTORICAL DATA ALLOWED
-- ═══════════════════════════════════════════════════════════════

-- Create schema for AZR records
CREATE SCHEMA IF NOT EXISTS azr;

-- ═══════════════════════════════════════════════════════════════
-- CONSTITUTIONAL AXIOMS REFERENCE TABLE (IMMUTABLE)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS azr.constitutional_axioms (
    axiom_id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    formal_logic TEXT NOT NULL,
    explanation TEXT NOT NULL,
    immutability VARCHAR(20) NOT NULL DEFAULT 'ABSOLUTE',
    enforcement TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    constitution_version VARCHAR(10) NOT NULL DEFAULT 'v26'
);

-- Insert constitutional axioms (immutable after creation)
INSERT INTO azr.constitutional_axioms (axiom_id, name, formal_logic, explanation, enforcement)
VALUES
(9, 'Law of Bounded Self-Improvement',
'∀ amendment ∈ System.Amendments: amendment.valid ⇔ (amendment.type ∈ AllowedCategories) ∧ (amendment.rate ≤ RateLimit) ∧ (amendment.approved_by = Arbiter.Court) ∧ (¬amendment.violates(ConstitutionalAxioms)) ∧ (amendment.rollback_plan ≠ ∅)',
'System may improve itself with absolute constraints. No change may violate constitutional axioms.',
'OPA + Runtime + Arbiter'),

(10, 'Law of Core Inviolability',
'∀ component ∈ System.Components: component.immutable_core = true ⇔ component ∈ {ConstitutionalAxioms, ArbiterAuthority, TruthLedger, GPUPolicy, CLIFirstPrinciple}',
'Constitutional axioms, arbiter authority, truth ledger, GPU-first policy, and CLI-first principle are inviolable.',
'Cryptographic Hash + OPA'),

(11, 'Law of Complete Commitment',
'∀ amendment ∈ AZR.Amendments: amendment.proposed ⇒ (∃ commitment ∈ CryptographicCommitments ∧ commitment.binding = true)',
'Every AZR proposal has a cryptographic commitment. Implementation is only possible when commitment is fulfilled.',
'Merkle Proofs + Hash Chain'),

(12, 'Law of Multi-Party Accountability',
'∀ decision ∈ AZR.Decisions: decision.valid ⇔ (∃ technical_approval) ∧ (∃ security_approval ∧ unanimous) ∧ (∃ business_approval) ∧ (∃ arbiter_approval ∧ unanimous)',
'No AZR decision can be made by a single party. Requires consensus from technical, security, business, and arbiter committees.',
'Multi-Signature + Voting Protocol'),

(13, 'Law of Inverse Proof',
'∀ claim ∈ AZR.Claims: claim.made ⇒ (∃ proof ∈ VerifiableProofs ∧ proof.verifiable = true)',
'Every statement in AZR requires proof. Proof must be independently verifiable.',
'ZK Proofs + Verification Chain'),

(14, 'Law of Temporal Irreversibility',
'∀ record ∈ AZR.Records: record.created ⇒ (record.timestamp ∈ ImmutableTimeline) ∧ (¬∃ modified_record ∧ modified_record.timestamp < record.timestamp)',
'Timestamps in AZR are immutable and monotonic. Decision chain always grows in time.',
'Monotonic Clock + Hash Chain')

ON CONFLICT (axiom_id) DO NOTHING;

-- Prevent any modification of axioms
CREATE OR REPLACE FUNCTION azr.prevent_axiom_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'CONSTITUTIONAL VIOLATION: Axioms cannot be modified (Axiom 10)';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_axioms
    BEFORE UPDATE OR DELETE ON azr.constitutional_axioms
    FOR EACH ROW EXECUTE FUNCTION azr.prevent_axiom_modification();

-- ═══════════════════════════════════════════════════════════════
-- MAIN AMENDMENTS TABLE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS azr.amendments (
    amendment_id UUID PRIMARY KEY,
    proposal_id UUID NOT NULL,

    -- Metadata
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'PARAMETER_TUNING', 'ALGORITHMIC_CHANGE',
        'ARCHITECTURAL_CHANGE', 'CONSTITUTIONAL_CHANGE'
    )),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'EXTREME')),

    -- Status
    current_state VARCHAR(50) NOT NULL CHECK (current_state IN (
        'PROPOSED', 'VALIDATING', 'SIMULATING', 'CHAOS_TESTING',
        'AWAITING_APPROVAL', 'APPROVED', 'DEPLOYING', 'ACTIVE',
        'ROLLING_BACK', 'ROLLED_BACK', 'REJECTED'
    )),
    states_history JSONB NOT NULL DEFAULT '[]',

    -- Risk Assessment
    risk_score DECIMAL(5,3) CHECK (risk_score >= 0 AND risk_score <= 1),
    risk_constraints JSONB DEFAULT '[]',

    -- Target Components
    target_components JSONB NOT NULL DEFAULT '[]',
    change_specification JSONB DEFAULT '{}',
    expected_impact JSONB DEFAULT '{}',

    -- Rollback Plan (Axiom 9)
    rollback_plan JSONB,
    rollback_tested BOOLEAN DEFAULT FALSE,

    -- Cryptographic Commitment (Axiom 11)
    commitment_hash CHAR(128),
    commitment_merkle_root CHAR(128),
    commitment_signature TEXT,
    commitment_binding BOOLEAN DEFAULT FALSE,
    commitment_fulfilled BOOLEAN DEFAULT FALSE,

    -- Multi-party Approvals (Axiom 12)
    technical_approval JSONB,
    security_approval JSONB,
    business_approval JSONB,
    arbiter_approval JSONB,
    witness_signatures JSONB DEFAULT '[]',
    approved_at TIMESTAMPTZ,

    -- Testing
    simulation_results JSONB,
    chaos_testing_completed BOOLEAN DEFAULT FALSE,
    chaos_testing_score DECIMAL(5,3),

    -- Deployment
    deployment_strategy JSONB,
    rollout_percentage DECIMAL(5,2) DEFAULT 0,
    deployed_at TIMESTAMPTZ,

    -- Rollback Tracking
    rollback_triggered BOOLEAN DEFAULT FALSE,
    rollback_reason VARCHAR(500),
    rollback_triggers JSONB DEFAULT '[]',
    rolled_back_at TIMESTAMPTZ,

    -- Hash Chain (Axiom 14)
    evidence_hash CHAR(128) NOT NULL,
    decision_hash CHAR(128) NOT NULL,
    previous_hash CHAR(128),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255) DEFAULT 'azr_system',

    -- Constraints
    CONSTRAINT fk_previous_hash FOREIGN KEY (previous_hash)
        REFERENCES azr.amendments(decision_hash) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_azr_category ON azr.amendments(category);
CREATE INDEX IF NOT EXISTS idx_azr_state ON azr.amendments(current_state);
CREATE INDEX IF NOT EXISTS idx_azr_risk ON azr.amendments(risk_level);
CREATE INDEX IF NOT EXISTS idx_azr_time ON azr.amendments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_azr_hash_chain ON azr.amendments(decision_hash, previous_hash);

-- ═══════════════════════════════════════════════════════════════
-- CONSTITUTIONAL VIOLATIONS LOG (APPEND-ONLY)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS azr.constitutional_violations (
    violation_id SERIAL PRIMARY KEY,
    amendment_id UUID REFERENCES azr.amendments(amendment_id),

    violation_code VARCHAR(20) NOT NULL,
    axiom_violated INTEGER NOT NULL REFERENCES azr.constitutional_axioms(axiom_id),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    message TEXT NOT NULL,
    action_taken VARCHAR(100) NOT NULL,
    escalation_target VARCHAR(100),

    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ
);

-- Prevent deletion of violation records (Axiom 14)
CREATE OR REPLACE FUNCTION azr.prevent_violation_deletion()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'CONSTITUTIONAL VIOLATION: Violation records cannot be deleted (Axiom 14)';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_violations
    BEFORE DELETE ON azr.constitutional_violations
    FOR EACH ROW EXECUTE FUNCTION azr.prevent_violation_deletion();

-- ═══════════════════════════════════════════════════════════════
-- ROLLBACK EVENTS LOG
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS azr.rollback_events (
    rollback_id SERIAL PRIMARY KEY,
    amendment_id UUID NOT NULL REFERENCES azr.amendments(amendment_id),

    trigger_type VARCHAR(50) NOT NULL,
    trigger_severity VARCHAR(20) NOT NULL,
    trigger_threshold DECIMAL(10,3),
    trigger_actual_value DECIMAL(10,3),
    trigger_description TEXT,

    rollback_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rollback_completed_at TIMESTAMPTZ,
    rollback_success BOOLEAN,

    state_before JSONB,
    state_after JSONB,
    evidence_hash CHAR(128)
);

-- ═══════════════════════════════════════════════════════════════
-- APPROVAL RECORDS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS azr.approval_records (
    approval_id SERIAL PRIMARY KEY,
    amendment_id UUID NOT NULL REFERENCES azr.amendments(amendment_id),

    committee_name VARCHAR(50) NOT NULL,
    votes_for INTEGER NOT NULL DEFAULT 0,
    votes_against INTEGER NOT NULL DEFAULT 0,
    total_votes INTEGER NOT NULL DEFAULT 0,

    is_approved BOOLEAN GENERATED ALWAYS AS (votes_for > votes_against) STORED,
    is_unanimous BOOLEAN GENERATED ALWAYS AS (votes_for = total_votes) STORED,

    voter_signatures JSONB DEFAULT '[]',
    deliberation_notes TEXT,

    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- ANALYTICS VIEWS
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW azr.amendment_analytics AS
SELECT
    category,
    risk_level,
    current_state,
    COUNT(*) as amendment_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration_seconds,
    SUM(CASE WHEN rollback_triggered THEN 1 ELSE 0 END) as rollback_count,
    AVG(risk_score) as avg_risk_score,
    MIN(created_at) as first_amendment,
    MAX(created_at) as last_amendment
FROM azr.amendments
GROUP BY category, risk_level, current_state
ORDER BY category, risk_level;

CREATE OR REPLACE VIEW azr.violation_summary AS
SELECT
    cv.axiom_violated,
    ca.name as axiom_name,
    cv.severity,
    COUNT(*) as violation_count,
    SUM(CASE WHEN cv.resolved THEN 1 ELSE 0 END) as resolved_count,
    MIN(cv.detected_at) as first_violation,
    MAX(cv.detected_at) as last_violation
FROM azr.constitutional_violations cv
JOIN azr.constitutional_axioms ca ON cv.axiom_violated = ca.axiom_id
GROUP BY cv.axiom_violated, ca.name, cv.severity
ORDER BY cv.axiom_violated, cv.severity;

CREATE OR REPLACE VIEW azr.approval_status AS
SELECT
    a.amendment_id,
    a.title,
    a.risk_level,
    COUNT(ar.approval_id) FILTER (WHERE ar.committee_name = 'technical' AND ar.is_approved) > 0 as technical_approved,
    COUNT(ar.approval_id) FILTER (WHERE ar.committee_name = 'security' AND ar.is_unanimous) > 0 as security_approved,
    COUNT(ar.approval_id) FILTER (WHERE ar.committee_name = 'business' AND ar.is_approved) > 0 as business_approved,
    COUNT(ar.approval_id) FILTER (WHERE ar.committee_name = 'arbiter' AND ar.is_unanimous) > 0 as arbiter_approved
FROM azr.amendments a
LEFT JOIN azr.approval_records ar ON a.amendment_id = ar.amendment_id
GROUP BY a.amendment_id, a.title, a.risk_level;

-- ═══════════════════════════════════════════════════════════════
-- UPDATE TRIGGER
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION azr.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_amendment_timestamp
    BEFORE UPDATE ON azr.amendments
    FOR EACH ROW EXECUTE FUNCTION azr.update_timestamp();

-- ═══════════════════════════════════════════════════════════════
-- HASH CHAIN VALIDATION FUNCTION
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION azr.validate_hash_chain()
RETURNS TABLE (
    amendment_id UUID,
    chain_valid BOOLEAN,
    issue TEXT
) AS $$
DECLARE
    rec RECORD;
    prev_hash CHAR(128);
BEGIN
    prev_hash := NULL;

    FOR rec IN
        SELECT a.amendment_id, a.decision_hash, a.previous_hash
        FROM azr.amendments a
        ORDER BY a.created_at ASC
    LOOP
        IF prev_hash IS NULL AND rec.previous_hash IS NOT NULL THEN
            amendment_id := rec.amendment_id;
            chain_valid := FALSE;
            issue := 'First record should have NULL previous_hash';
            RETURN NEXT;
        ELSIF prev_hash IS NOT NULL AND rec.previous_hash != prev_hash THEN
            amendment_id := rec.amendment_id;
            chain_valid := FALSE;
            issue := 'Hash chain broken: previous_hash does not match';
            RETURN NEXT;
        ELSE
            amendment_id := rec.amendment_id;
            chain_valid := TRUE;
            issue := NULL;
            RETURN NEXT;
        END IF;

        prev_hash := rec.decision_hash;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- RATE LIMIT CHECK FUNCTION
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION azr.check_rate_limit(
    p_risk_level VARCHAR,
    p_period_days INTEGER,
    p_limit INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_count
    FROM azr.amendments
    WHERE risk_level = p_risk_level
    AND created_at > NOW() - (p_period_days || ' days')::INTERVAL;

    RETURN current_count < p_limit;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════

COMMENT ON SCHEMA azr IS 'AZR (Autonomous Zero-Risk Amendment Runtime) - Constitutional framework for safe system self-improvement';
COMMENT ON TABLE azr.constitutional_axioms IS 'Immutable constitutional axioms (9-14) that govern all AZR operations';
COMMENT ON TABLE azr.amendments IS 'Main amendment records with full lifecycle tracking and hash chain';
COMMENT ON TABLE azr.constitutional_violations IS 'Append-only log of all constitutional violations detected';
COMMENT ON TABLE azr.rollback_events IS 'Log of all rollback events triggered by the system';
COMMENT ON TABLE azr.approval_records IS 'Multi-party approval records for amendments';
