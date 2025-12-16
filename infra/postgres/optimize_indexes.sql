-- Optimization Indexes for Predator Analytics v22.0
-- Applied to improve query performance on search and filtering

-- 1. Companies Indexes
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_kved ON companies (kved);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies (status);

-- 2. Tenders Indexes
CREATE INDEX IF NOT EXISTS idx_tenders_amount ON tenders (amount);
CREATE INDEX IF NOT EXISTS idx_tenders_dates ON tenders (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tenders_procuring_entity ON tenders (procuring_entity_edrpou);
CREATE INDEX IF NOT EXISTS idx_tenders_title_trgm ON tenders USING gin (title gin_trgm_ops);

-- 3. Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp ON search_analytics (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics (query);

-- 4. Documents (Core) Indexes
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_source_type ON documents (source_type);
-- GIN index for JSONB metadata optimization
CREATE INDEX IF NOT EXISTS idx_documents_meta ON documents USING gin (meta);

-- 5. ML Jobs Indexes
CREATE INDEX IF NOT EXISTS idx_ml_jobs_status ON ml_jobs (status);
CREATE INDEX IF NOT EXISTS idx_ml_jobs_created_at ON ml_jobs (created_at DESC);

-- Enable extension if not exists (required for trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
