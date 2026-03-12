-- ============================================================
-- PREDATOR Analytics v55.1 — Міграція для Ingestion Pipeline
-- Створено: 2026-03-12
-- ============================================================

-- ============================================================
-- Таблиця карантину (DLQ для невалідних записів)
-- ============================================================
CREATE TABLE IF NOT EXISTS ingestion_quarantine (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES ingestion_jobs(id) ON DELETE CASCADE,
    original_record JSONB NOT NULL,
    errors JSONB NOT NULL,
    quarantined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_action VARCHAR(50),
    resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_quarantine_tenant ON ingestion_quarantine(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quarantine_job ON ingestion_quarantine(job_id);
CREATE INDEX IF NOT EXISTS idx_quarantine_unresolved ON ingestion_quarantine(resolved_at) WHERE resolved_at IS NULL;

-- ============================================================
-- Таблиця митних декларацій (розширена для інгестії)
-- ============================================================
CREATE TABLE IF NOT EXISTS customs_declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    declaration_number VARCHAR(100),
    declaration_date DATE,
    company_edrpou VARCHAR(10),
    ueid VARCHAR(64),
    product_description TEXT,
    uktzed_code VARCHAR(20),
    customs_value NUMERIC(18, 2),
    weight NUMERIC(18, 4),
    country_origin VARCHAR(100),
    customs_post VARCHAR(255),
    record_hash VARCHAR(64) UNIQUE,
    job_id UUID REFERENCES ingestion_jobs(id),
    validation_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customs_decl_tenant ON customs_declarations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customs_decl_edrpou ON customs_declarations(company_edrpou);
CREATE INDEX IF NOT EXISTS idx_customs_decl_ueid ON customs_declarations(ueid);
CREATE INDEX IF NOT EXISTS idx_customs_decl_uktzed ON customs_declarations(uktzed_code);
CREATE INDEX IF NOT EXISTS idx_customs_decl_date ON customs_declarations(declaration_date);
CREATE INDEX IF NOT EXISTS idx_customs_decl_job ON customs_declarations(job_id);
CREATE INDEX IF NOT EXISTS idx_customs_decl_hash ON customs_declarations(record_hash);
CREATE INDEX IF NOT EXISTS idx_customs_decl_country ON customs_declarations(country_origin);

-- RLS для нових таблиць
ALTER TABLE ingestion_quarantine ENABLE ROW LEVEL SECURITY;
ALTER TABLE customs_declarations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_quarantine ON ingestion_quarantine;
DROP POLICY IF EXISTS tenant_isolation_customs_decl ON customs_declarations;

CREATE POLICY tenant_isolation_quarantine ON ingestion_quarantine
    USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_customs_decl ON customs_declarations
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Тригер для updated_at
DROP TRIGGER IF EXISTS set_updated_at_customs_decl ON customs_declarations;
CREATE TRIGGER set_updated_at_customs_decl BEFORE UPDATE ON customs_declarations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Оновлення ingestion_jobs для підтримки нових статусів
-- ============================================================
DO $$
BEGIN
    -- Додаємо колонку file_content_hash якщо не існує
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ingestion_jobs' AND column_name = 'file_content_hash') THEN
        ALTER TABLE ingestion_jobs ADD COLUMN file_content_hash VARCHAR(64);
    END IF;

    -- Додаємо колонку s3_path якщо не існує
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ingestion_jobs' AND column_name = 's3_path') THEN
        ALTER TABLE ingestion_jobs ADD COLUMN s3_path TEXT;
    END IF;

    -- Додаємо колонку records_quarantined якщо не існує
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ingestion_jobs' AND column_name = 'records_quarantined') THEN
        ALTER TABLE ingestion_jobs ADD COLUMN records_quarantined INTEGER DEFAULT 0;
    END IF;

    -- Додаємо колонку records_duplicates якщо не існує
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ingestion_jobs' AND column_name = 'records_duplicates') THEN
        ALTER TABLE ingestion_jobs ADD COLUMN records_duplicates INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- Коментарі до таблиць
-- ============================================================
COMMENT ON TABLE ingestion_quarantine IS 'Карантин для невалідних записів (DLQ)';
COMMENT ON TABLE customs_declarations IS 'Митні декларації з інгестованих файлів';
COMMENT ON COLUMN customs_declarations.record_hash IS 'SHA256 хеш для дедуплікації';
COMMENT ON COLUMN customs_declarations.validation_flags IS 'Флаги валідації (WARNING/ERROR)';
