-- PREDATOR ANALYTICS v30.2 - Robust Hardened Performance Indexes
-- Created by Antigravity (Pair Programming with Dima)
-- Date: 2026-01-15 (Improved Stability)

-- Ensure essential extensions and schemas exist
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE SCHEMA IF NOT EXISTS azr;
CREATE SCHEMA IF NOT EXISTS truth;
CREATE SCHEMA IF NOT EXISTS gold;
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS raw;

-- Use a DO block to safely apply indexes only where tables exist
DO $$
BEGIN
    -- 1. Core Platform Indexes (Gold Schema)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'gold' AND tablename = 'documents') THEN
        CREATE INDEX IF NOT EXISTS idx_gold_docs_source_ts ON gold.documents (source_type, created_at DESC);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'gold' AND tablename = 'cases') THEN
        CREATE INDEX IF NOT EXISTS idx_gold_cases_status_risk ON gold.cases (status, risk_score DESC);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'gold' AND tablename = 'trinity_audit_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_gold_trinity_audit_ts_desc ON gold.trinity_audit_logs (created_at DESC);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'gold' AND tablename = 'ml_jobs') THEN
        CREATE INDEX IF NOT EXISTS idx_gold_ml_jobs_metrics ON gold.ml_jobs (status, created_at DESC);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'gold' AND tablename = 'file_registry') THEN
        CREATE INDEX IF NOT EXISTS idx_gold_files_idempotency ON gold.file_registry (content_hash, status);
    END IF;

    -- 2. Business Entity Indexes (Gold Schema)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'gold' AND tablename = 'companies') THEN
        CREATE INDEX IF NOT EXISTS idx_gold_companies_name_trgm ON gold.companies USING gin (name gin_trgm_ops);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'gold' AND tablename = 'tenders') THEN
        CREATE INDEX IF NOT EXISTS idx_gold_tenders_winner_lookup ON gold.tenders (winner_edrpou, amount DESC);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'gold' AND tablename = 'risk_assessments') THEN
        CREATE INDEX IF NOT EXISTS idx_gold_risk_latest ON gold.risk_assessments (company_edrpou, assessed_at DESC);
    END IF;

    -- 3. Ingestion & ETL Pipeline (Staging/Raw Schemas)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'staging' AND tablename = 'raw_data') THEN
        CREATE INDEX IF NOT EXISTS idx_staging_raw_processing ON staging.raw_data (source, processed, fetched_at);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'raw' AND tablename = 'etl_jobs') THEN
        CREATE INDEX IF NOT EXISTS idx_raw_etl_job_tracking ON raw.etl_jobs (state, updated_at DESC);
    END IF;

    -- 4. Constitutional Truth Ledger (Public Schema - Service specific)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'truth_ledger') THEN
        CREATE INDEX IF NOT EXISTS idx_pub_ledger_ts_desc ON public.truth_ledger (created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_pub_ledger_action_entity ON public.truth_ledger (action, entity_type);
    END IF;

    -- 5. Forensic Truth Ledger (Truth Schema - ETL specific)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'truth' AND tablename = 'etl_state_decisions') THEN
        CREATE INDEX IF NOT EXISTS idx_truth_etl_dec_chain ON truth.etl_state_decisions (job_id, derived_at DESC);
        CREATE INDEX IF NOT EXISTS idx_truth_etl_dec_hash ON truth.etl_state_decisions (decision_hash);
    END IF;

    -- 6. AZR Sovereign Ledger (AZR Schema)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'azr' AND tablename = 'amendments') THEN
        CREATE INDEX IF NOT EXISTS idx_azr_amendments_chain ON azr.amendments (current_state, created_at DESC);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'azr' AND tablename = 'constitutional_violations') THEN
        CREATE INDEX IF NOT EXISTS idx_azr_violations_axiom ON azr.constitutional_violations (axiom_violated, detected_at DESC);
    END IF;

    -- 7. Knowledge Graph (Gold Schema)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'gold' AND tablename = 'graph_edges') THEN
        CREATE INDEX IF NOT EXISTS idx_gold_graph_edges_doc ON gold.graph_edges (doc_id);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'gold' AND tablename = 'graph_nodes') THEN
        CREATE INDEX IF NOT EXISTS idx_gold_graph_nodes_type_name ON gold.graph_nodes (label, name);
    END IF;

    -- 8. Audit Chain (Public Schema)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_chain') THEN
        CREATE INDEX IF NOT EXISTS idx_pub_audit_chain_verified ON public.audit_chain (verified_at DESC);
        CREATE INDEX IF NOT EXISTS idx_pub_audit_chain_auditor ON public.audit_chain (auditor_id);
    END IF;

END $$;
