-- ============================================================
-- PREDATOR Analytics v55.1
-- PostgreSQL 16 — Повна схема бази даних
-- Створено: 2026-03-08
-- HR-07: Ніколи SELECT * | HR-16: WORM (audit_log, decision_artifacts)
-- ============================================================

-- ============================================================
-- Розширення
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================
-- Тенанти
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'basic',
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_users INTEGER NOT NULL DEFAULT 10,
    max_storage_gb INTEGER NOT NULL DEFAULT 50,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Користувачі
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret VARCHAR(255),
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- Компанії
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ueid VARCHAR(64) NOT NULL UNIQUE,
    edrpou VARCHAR(10),
    name VARCHAR(500) NOT NULL,
    name_normalized VARCHAR(500),
    legal_form VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    registration_date DATE,
    address TEXT,
    address_normalized TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    industry VARCHAR(255),
    cers_score SMALLINT,
    cers_level VARCHAR(20),
    cers_updated_at TIMESTAMPTZ,
    source VARCHAR(100),
    content_hash VARCHAR(64),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_content_hash ON companies(content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_tenant ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_ueid ON companies(ueid);
CREATE INDEX IF NOT EXISTS idx_companies_edrpou ON companies(edrpou);
CREATE INDEX IF NOT EXISTS idx_companies_name_gin ON companies USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_name_normalized_gin ON companies USING gin(name_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_cers ON companies(cers_score);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- ============================================================
-- Фізичні особи
-- ============================================================
CREATE TABLE IF NOT EXISTS persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ueid VARCHAR(64) NOT NULL UNIQUE,
    inn VARCHAR(10),
    full_name VARCHAR(500) NOT NULL,
    full_name_normalized VARCHAR(500),
    date_of_birth DATE,
    is_pep BOOLEAN NOT NULL DEFAULT false,
    is_sanctioned BOOLEAN NOT NULL DEFAULT false,
    pep_details JSONB,
    sanctions_details JSONB,
    source VARCHAR(100),
    content_hash VARCHAR(64),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_persons_content_hash ON persons(content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persons_tenant ON persons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_persons_ueid ON persons(ueid);
CREATE INDEX IF NOT EXISTS idx_persons_inn ON persons(inn);
CREATE INDEX IF NOT EXISTS idx_persons_name_gin ON persons USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_persons_pep ON persons(is_pep) WHERE is_pep = true;
CREATE INDEX IF NOT EXISTS idx_persons_sanctioned ON persons(is_sanctioned) WHERE is_sanctioned = true;

-- ============================================================
-- Митні декларації
-- ============================================================
CREATE TABLE IF NOT EXISTS declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    declaration_number VARCHAR(50) NOT NULL UNIQUE,
    declaration_date DATE,
    direction VARCHAR(10) NOT NULL DEFAULT 'import',
    importer_ueid VARCHAR(64),
    importer_name VARCHAR(500),
    importer_edrpou VARCHAR(10),
    exporter_ueid VARCHAR(64),
    exporter_name VARCHAR(500),
    exporter_country VARCHAR(100),
    uktzed_code VARCHAR(20) NOT NULL,
    goods_description TEXT,
    goods_description_normalized TEXT,
    quantity NUMERIC(18, 4),
    unit VARCHAR(20),
    net_weight_kg NUMERIC(18, 4),
    gross_weight_kg NUMERIC(18, 4),
    invoice_value_usd NUMERIC(18, 2),
    customs_value_usd NUMERIC(18, 2),
    statistical_value_usd NUMERIC(18, 2),
    price_per_unit_usd NUMERIC(18, 4),
    country_origin VARCHAR(100),
    country_destination VARCHAR(100),
    customs_post VARCHAR(255),
    source VARCHAR(100),
    content_hash VARCHAR(64),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_declarations_content_hash ON declarations(content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_declarations_tenant ON declarations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_declarations_date ON declarations(declaration_date);
CREATE INDEX IF NOT EXISTS idx_declarations_importer ON declarations(importer_ueid);
CREATE INDEX IF NOT EXISTS idx_declarations_exporter ON declarations(exporter_ueid);
CREATE INDEX IF NOT EXISTS idx_declarations_uktzed ON declarations(uktzed_code);
CREATE INDEX IF NOT EXISTS idx_declarations_country_origin ON declarations(country_origin);
CREATE INDEX IF NOT EXISTS idx_declarations_direction ON declarations(direction);

-- ============================================================
-- Зв'язки Компанія ↔ Особа
-- ============================================================
CREATE TABLE IF NOT EXISTS company_person_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    link_type VARCHAR(50) NOT NULL,
    share_percent NUMERIC(5, 2),
    start_date DATE,
    end_date DATE,
    source VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cp_links_tenant ON company_person_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cp_links_company ON company_person_links(company_id);
CREATE INDEX IF NOT EXISTS idx_cp_links_person ON company_person_links(person_id);
CREATE INDEX IF NOT EXISTS idx_cp_links_type ON company_person_links(link_type);

-- ============================================================
-- Санкційні списки
-- ============================================================
CREATE TABLE IF NOT EXISTS sanctions_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_name VARCHAR(500) NOT NULL,
    entity_name_normalized VARCHAR(500),
    entity_identifiers JSONB,
    reason TEXT,
    date_listed DATE,
    date_delisted DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    source_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sanctions_list ON sanctions_entries(list_name);
CREATE INDEX IF NOT EXISTS idx_sanctions_active ON sanctions_entries(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sanctions_name_gin ON sanctions_entries USING gin(entity_name gin_trgm_ops);

-- ============================================================
-- Довідник УКТЗЕД
-- ============================================================
CREATE TABLE IF NOT EXISTS uktzed_codes (
    code VARCHAR(20) PRIMARY KEY,
    parent_code VARCHAR(20),
    level SMALLINT NOT NULL,
    name_uk VARCHAR(1000) NOT NULL,
    name_en VARCHAR(1000),
    duty_rate NUMERIC(5, 2),
    vat_rate NUMERIC(5, 2),
    excise_rate NUMERIC(5, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uktzed_parent ON uktzed_codes(parent_code);
CREATE INDEX IF NOT EXISTS idx_uktzed_level ON uktzed_codes(level);

-- ============================================================
-- Завдання інгестії
-- ============================================================
CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    job_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(500),
    file_size BIGINT,
    file_path TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    progress SMALLINT DEFAULT 0,
    records_total INTEGER,
    records_processed INTEGER DEFAULT 0,
    records_errors INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON ingestion_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON ingestion_jobs(created_at);

-- ============================================================
-- Сповіщення
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_tenant ON alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);

-- ============================================================
-- Події алертів (Alert Events) — TZ §2.3.1
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    entity_ueid VARCHAR(64),
    payload JSONB NOT NULL,
    delivery_status JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_alert_events_alert ON alert_events(alert_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_events_entity ON alert_events(entity_ueid, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_events_tenant ON alert_events(tenant_id);

-- ============================================================
-- Аудит (WORM — тільки INSERT)
-- HR-16: UPDATE/DELETE заборонені тригером
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Модифікація журналу аудиту заборонена (WORM)';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_no_update ON audit_log;
DROP TRIGGER IF EXISTS trg_audit_no_delete ON audit_log;

CREATE TRIGGER trg_audit_no_update
    BEFORE UPDATE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trg_audit_no_delete
    BEFORE DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- ============================================================
-- Артефакти ШІ-рішень (WORM)
-- HR-16: UPDATE/DELETE заборонені тригером
-- ============================================================
CREATE TABLE IF NOT EXISTS decision_artifacts (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID,
    decision_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    model_name VARCHAR(255),
    model_version VARCHAR(50),
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    confidence NUMERIC(5, 4),
    explanation JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION prevent_decision_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Модифікація артефактів рішень заборонена (WORM)';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_decision_no_update ON decision_artifacts;
DROP TRIGGER IF EXISTS trg_decision_no_delete ON decision_artifacts;

CREATE TRIGGER trg_decision_no_update
    BEFORE UPDATE ON decision_artifacts
    FOR EACH ROW EXECUTE FUNCTION prevent_decision_modification();

CREATE TRIGGER trg_decision_no_delete
    BEFORE DELETE ON decision_artifacts
    FOR EACH ROW EXECUTE FUNCTION prevent_decision_modification();

CREATE INDEX IF NOT EXISTS idx_decisions_tenant ON decision_artifacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON decision_artifacts(decision_type);
CREATE INDEX IF NOT EXISTS idx_decisions_entity ON decision_artifacts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_decisions_created ON decision_artifacts(created_at);

-- ============================================================
-- Risk Scores (CERS — 5-рівнева оцінка ризику)
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_ueid VARCHAR(64) NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'company',
    score_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cers FLOAT NOT NULL,
    cers_confidence FLOAT NOT NULL DEFAULT 0.0,
    behavioral_score FLOAT,
    institutional_score FLOAT,
    influence_score FLOAT,
    structural_score FLOAT,
    predictive_score FLOAT,
    flags JSONB DEFAULT '[]'::jsonb,
    explanation JSONB,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_scores_tenant ON risk_scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_ueid ON risk_scores(entity_ueid);
CREATE INDEX IF NOT EXISTS idx_risk_scores_date ON risk_scores(score_date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_scores_entity_type ON risk_scores(entity_type);

-- ============================================================
-- SOM Аномалії (Self-Organizing Map)
-- ============================================================
CREATE TABLE IF NOT EXISTS som_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50),
    severity VARCHAR(20),
    entity_ueid VARCHAR(64),
    message VARCHAR(1000),
    details JSONB,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_som_anomalies_tenant ON som_anomalies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_som_anomalies_ueid ON som_anomalies(entity_ueid);
CREATE INDEX IF NOT EXISTS idx_som_anomalies_severity ON som_anomalies(severity);

-- ============================================================
-- SOM Пропозиції
-- ============================================================
CREATE TABLE IF NOT EXISTS som_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50),
    confidence FLOAT,
    title VARCHAR(255),
    ueid VARCHAR(64),
    status VARCHAR(20) DEFAULT 'pending',
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_som_proposals_tenant ON som_proposals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_som_proposals_ueid ON som_proposals(ueid);
CREATE INDEX IF NOT EXISTS idx_som_proposals_status ON som_proposals(status);

-- ============================================================
-- Row-Level Security
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_person_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE som_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE som_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_companies ON companies;
DROP POLICY IF EXISTS tenant_isolation_persons ON persons;
DROP POLICY IF EXISTS tenant_isolation_declarations ON declarations;
DROP POLICY IF EXISTS tenant_isolation_cp_links ON company_person_links;
DROP POLICY IF EXISTS tenant_isolation_jobs ON ingestion_jobs;
DROP POLICY IF EXISTS tenant_isolation_audit ON audit_log;
DROP POLICY IF EXISTS tenant_isolation_decisions ON decision_artifacts;
DROP POLICY IF EXISTS tenant_isolation_risk_scores ON risk_scores;
DROP POLICY IF EXISTS tenant_isolation_som_anomalies ON som_anomalies;
DROP POLICY IF EXISTS tenant_isolation_som_proposals ON som_proposals;
DROP POLICY IF EXISTS tenant_isolation_alert_events ON alert_events;

CREATE POLICY tenant_isolation_companies ON companies
    USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_persons ON persons
    USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_declarations ON declarations
    USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_cp_links ON company_person_links
    USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_jobs ON ingestion_jobs
    USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_audit ON audit_log
    USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_decisions ON decision_artifacts
    USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_risk_scores ON risk_scores
    USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_som_anomalies ON som_anomalies
    USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_som_proposals ON som_proposals
    USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_alert_events ON alert_events
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- ============================================================
-- Службові функції
-- ============================================================
CREATE OR REPLACE FUNCTION set_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant', p_tenant_id::text, false);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_companies ON companies;
DROP TRIGGER IF EXISTS set_updated_at_persons ON persons;
DROP TRIGGER IF EXISTS set_updated_at_declarations ON declarations;
DROP TRIGGER IF EXISTS set_updated_at_users ON users;
DROP TRIGGER IF EXISTS set_updated_at_tenants ON tenants;
DROP TRIGGER IF EXISTS set_updated_at_jobs ON ingestion_jobs;

CREATE TRIGGER set_updated_at_companies BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_persons BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_declarations BEFORE UPDATE ON declarations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_tenants BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_jobs BEFORE UPDATE ON ingestion_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Seed (DEV ONLY)
-- ============================================================
INSERT INTO tenants (id, name, slug, plan)
VALUES ('a0000000-0000-0000-0000-000000000001', 'PREDATOR Dev', 'predator-dev', 'enterprise')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'admin@predator.dev', '$2b$12$LJ3m4yv1sVVp5IXBQKJQ4OX5.lX5hVaYKvKVhA3uOXFh0RI5bPJSi',
   'Адміністратор', 'admin'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'analyst@predator.dev', '$2b$12$LJ3m4yv1sVVp5IXBQKJQ4OX5.lX5hVaYKvKVhA3uOXFh0RI5bPJSi',
   'Аналітик', 'analyst'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'viewer@predator.dev', '$2b$12$LJ3m4yv1sVVp5IXBQKJQ4OX5.lX5hVaYKvKVhA3uOXFh0RI5bPJSi',
   'Глядач', 'viewer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO audit_log (tenant_id, action, details)
VALUES ('a0000000-0000-0000-0000-000000000001', 'system_init',
        '{"message": "PREDATOR Analytics v55.1 ініціалізовано", "version": "55.1"}'::jsonb);
