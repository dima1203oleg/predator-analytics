-- ============================================================
-- PREDATOR Analytics v63.0-ELITE (War-gaming Horizon)
-- Canonical Database Schema
-- PostgreSQL 16 — Повна схема бази даних
-- Створено: 2026-03-08 (Оновлено: 2026-05-02)
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
-- HR-16: UPDATE/DELETE заборонені тригером (крім міграцій Alembic)
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

-- ============================================================
-- Службова функція для розпізнавання контексту міграції Alembic
-- Використовується WORM-тригерами для пропуску системних змін
--
-- ПРИКЛАД ВИКОРИСТАННЯ В ALEMBIC МІГРАЦІЇ:
-- ```python
-- def upgrade():
--     op.execute("SET LOCAL app.alembic_migration = 'true'")
--     op.add_column('audit_log', sa.Column('new_field', sa.String()))
-- ```
--
-- HR-16: WORM таблиці (audit_log, decision_artifacts) захищені тригерами
-- ============================================================
CREATE OR REPLACE FUNCTION is_alembic_migration()
RETURNS BOOLEAN AS $$
BEGIN
    -- Перевіряємо, чи встановлено прапор міграції
    -- Використовується в Alembic міграціях через: SET LOCAL app.alembic_migration = 'true';
    RETURN COALESCE(current_setting('app.alembic_migration', true), 'false')::BOOLEAN;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Канонічний WORM-тригер для audit_log
-- Забороняє модифікацію, крім контексту міграції Alembic
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Пропускаємо, якщо це міграція Alembic
    IF is_alembic_migration() THEN
        RETURN NEW;
    END IF;
    
    RAISE EXCEPTION 'Модифікація журналу аудиту заборонена (WORM). Використовуйте app.alembic_migration=true для системних змін.';
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
-- HR-16: UPDATE/DELETE заборонені тригером (крім міграцій Alembic)
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

-- ============================================================
-- Канонічний WORM-тригер для decision_artifacts
-- Забороняє модифікацію, крім контексту міграції Alembic
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_decision_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Пропускаємо, якщо це міграція Alembic
    IF is_alembic_migration() THEN
        RETURN NEW;
    END IF;
    
    RAISE EXCEPTION 'Модифікація артефактів рішень заборонена (WORM). Використовуйте app.alembic_migration=true для системних змін.';
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
-- Податкові дані (для датасетів #6, #17, #39, #59, #72)
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_ueid VARCHAR(64) NOT NULL,
    company_edrpou VARCHAR(10),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    vat_obligations NUMERIC(18, 2),
    vat_paid NUMERIC(18, 2),
    income_tax NUMERIC(18, 2),
    total_tax_obligations NUMERIC(18, 2),
    total_tax_paid NUMERIC(18, 2),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_company ON tax_records(company_ueid);
CREATE INDEX IF NOT EXISTS idx_tax_period ON tax_records(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_tax_tenant ON tax_records(tenant_id);

-- ============================================================
-- Податкові накладні (для датасету #17)
-- ============================================================
CREATE TABLE IF NOT EXISTS vat_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    company_ueid VARCHAR(64) NOT NULL,
    invoice_date DATE NOT NULL,
    amount NUMERIC(18, 2),
    vat_amount NUMERIC(18, 2),
    related_declaration_id UUID REFERENCES declarations(id),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vat_company ON vat_invoices(company_ueid);
CREATE INDEX IF NOT EXISTS idx_vat_date ON vat_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_vat_declaration ON vat_invoices(related_declaration_id);

-- ============================================================
-- Митні брокери (для датасетів #9, #71)
-- ============================================================
CREATE TABLE IF NOT EXISTS customs_brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    broker_ueid VARCHAR(64) NOT NULL UNIQUE,
    license_number VARCHAR(50),
    name VARCHAR(500) NOT NULL,
    name_normalized VARCHAR(500),
    registration_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    address TEXT,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    specializations JSONB DEFAULT '[]',
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brokers_tenant ON customs_brokers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brokers_ueid ON customs_brokers(broker_ueid);
CREATE INDEX IF NOT EXISTS idx_brokers_name_gin ON customs_brokers USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_brokers_status ON customs_brokers(status);

-- ============================================================
-- Зв'язки Брокер ↔ Декларація
-- ============================================================
CREATE TABLE IF NOT EXISTS broker_declaration_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES customs_brokers(id) ON DELETE CASCADE,
    declaration_id UUID NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    role VARCHAR(50),
    source VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broker_decl_tenant ON broker_declaration_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_broker_decl_broker ON broker_declaration_links(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_decl_declaration ON broker_declaration_links(declaration_id);

-- ============================================================
-- Нормативні акти (для датасетів #1, #76)
-- ============================================================
CREATE TABLE IF NOT EXISTS regulatory_acts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    act_number VARCHAR(100) NOT NULL,
    act_type VARCHAR(50) NOT NULL,
    act_date DATE NOT NULL,
    effective_date DATE,
    title TEXT NOT NULL,
    description TEXT,
    issuer VARCHAR(255),
    uktzed_codes_affected JSONB DEFAULT '[]',
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reg_acts_date ON regulatory_acts(act_date);
CREATE INDEX IF NOT EXISTS idx_reg_acts_type ON regulatory_acts(act_type);
CREATE INDEX IF NOT EXISTS idx_reg_acts_number ON regulatory_acts(act_number);

-- ============================================================
-- Ринкові ціни (для датасетів #5, #44, #89)
-- ============================================================
CREATE TABLE IF NOT EXISTS market_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uktzed_code VARCHAR(20) NOT NULL,
    country VARCHAR(100),
    price_min_usd NUMERIC(18, 4),
    price_max_usd NUMERIC(18, 4),
    price_avg_usd NUMERIC(18, 4),
    price_date DATE NOT NULL,
    source VARCHAR(100),
    confidence_level NUMERIC(3, 2),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_uktzed ON market_prices(uktzed_code);
CREATE INDEX IF NOT EXISTS idx_market_date ON market_prices(price_date);
CREATE INDEX IF NOT EXISTS idx_market_country ON market_prices(country);

-- ============================================================
-- Геодані митних постів (для датасетів #3, #46, #62)
-- ============================================================
CREATE TABLE IF NOT EXISTS customs_posts_geo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_code VARCHAR(50) NOT NULL UNIQUE,
    post_name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    country VARCHAR(100),
    region VARCHAR(100),
    border_type VARCHAR(50),
    infrastructure_type VARCHAR(50),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_post_code ON customs_posts_geo(post_code);
CREATE INDEX IF NOT EXISTS idx_geo_location ON customs_posts_geo USING GIST (point(longitude, latitude));

-- ============================================================
-- Виробничі дані країн (для датасетів #15, #68)
-- ============================================================
CREATE TABLE IF NOT EXISTS country_production (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(3) NOT NULL,
    uktzed_code VARCHAR(20) NOT NULL,
    has_production BOOLEAN NOT NULL,
    production_capacity VARCHAR(255),
    major_producers JSONB DEFAULT '[]',
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_country ON country_production(country_code);
CREATE INDEX IF NOT EXISTS idx_production_uktzed ON country_production(uktzed_code);

-- ============================================================
-- Бренд-реєстр (для датасетів #8, #53, #98)
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(255) NOT NULL,
    brand_name_normalized VARCHAR(255),
    owner_company VARCHAR(500),
    registration_country VARCHAR(100),
    registration_date DATE,
    categories JSONB DEFAULT '[]',
    is_verified BOOLEAN DEFAULT false,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_name ON brand_registry(brand_name);
CREATE INDEX IF NOT EXISTS idx_brand_normalized ON brand_registry(brand_name_normalized);
CREATE INDEX IF NOT EXISTS idx_brand_owner ON brand_registry(owner_company);

-- ============================================================
-- Ліцензії та дозволи (для датасету #76)
-- ============================================================
CREATE TABLE IF NOT EXISTS licenses_permits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_ueid VARCHAR(64) NOT NULL,
    license_type VARCHAR(100) NOT NULL,
    license_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    issuing_authority VARCHAR(255),
    scope TEXT,
    uktzed_codes_affected JSONB DEFAULT '[]',
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_company ON licenses_permits(company_ueid);
CREATE INDEX IF NOT EXISTS idx_licenses_type ON licenses_permits(license_type);
CREATE INDEX IF NOT EXISTS idx_licenses_date ON licenses_permits(issue_date);

-- ============================================================
-- Митні чиновники (для датасетів #11, #47, #50)
-- ============================================================
CREATE TABLE IF NOT EXISTS customs_officials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    full_name_normalized VARCHAR(255),
    position VARCHAR(255),
    customs_post_code VARCHAR(50),
    appointment_date DATE,
    dismissal_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_officials_tenant ON customs_officials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_officials_post ON customs_officials(customs_post_code);
CREATE INDEX IF NOT EXISTS idx_officials_status ON customs_officials(status);
CREATE INDEX IF NOT EXISTS idx_officials_name_gin ON customs_officials USING gin(full_name gin_trgm_ops);

-- ============================================================
-- Зв'язки Чиновник ↔ Декларація
-- ============================================================
CREATE TABLE IF NOT EXISTS official_declaration_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    official_id UUID NOT NULL REFERENCES customs_officials(id) ON DELETE CASCADE,
    declaration_id UUID NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    role VARCHAR(50),
    source VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_official_decl_tenant ON official_declaration_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_official_decl_official ON official_declaration_links(official_id);
CREATE INDEX IF NOT EXISTS idx_official_decl_declaration ON official_declaration_links(declaration_id);

-- ============================================================
-- Візити чиновників (для датасету #21)
-- ============================================================
CREATE TABLE IF NOT EXISTS official_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    official_id UUID REFERENCES customs_officials(id),
    visit_date DATE NOT NULL,
    region VARCHAR(100),
    purpose TEXT,
    description TEXT,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_official ON official_visits(official_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON official_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_region ON official_visits(region);

-- ============================================================
-- Реєстр складів (для датасету #83)
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouse_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    license_number VARCHAR(100),
    customs_post_code VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    capacity_sqm NUMERIC(10, 2),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_code ON warehouse_registry(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_warehouse_post ON warehouse_registry(customs_post_code);
CREATE INDEX IF NOT EXISTS idx_warehouse_active ON warehouse_registry(is_active);

-- ============================================================
-- COMTRADE дані (для датасету #93)
-- ============================================================
CREATE TABLE IF NOT EXISTS comtrade_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_country_code VARCHAR(3) NOT NULL,
    partner_country_code VARCHAR(3) NOT NULL,
    uktzed_code VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    period INTEGER,
    export_value_usd NUMERIC(18, 2),
    import_value_usd NUMERIC(18, 2),
    quantity NUMERIC(18, 4),
    quantity_unit VARCHAR(50),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comtrade_reporter ON comtrade_data(reporter_country_code);
CREATE INDEX IF NOT EXISTS idx_comtrade_partner ON comtrade_data(partner_country_code);
CREATE INDEX IF NOT EXISTS idx_comtrade_uktzed ON comtrade_data(uktzed_code);
CREATE INDEX IF NOT EXISTS idx_comtrade_year ON comtrade_data(year);

-- ============================================================
-- Медіа-розслідування (для датасетів #54, #67)
-- ============================================================
CREATE TABLE IF NOT EXISTS media_investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    publication_date DATE NOT NULL,
    source VARCHAR(255),
    url TEXT,
    entities_mentioned JSONB DEFAULT '[]',
    investigation_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'published',
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_date ON media_investigations(publication_date);
CREATE INDEX IF NOT EXISTS idx_media_source ON media_investigations(source);
CREATE INDEX IF NOT EXISTS idx_media_type ON media_investigations(investigation_type);

-- ============================================================
-- Зв'язки Медіа ↔ Компанія
-- ============================================================
CREATE TABLE IF NOT EXISTS media_company_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES media_investigations(id) ON DELETE CASCADE,
    company_ueid VARCHAR(64) NOT NULL,
    mention_type VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_company_investigation ON media_company_links(investigation_id);
CREATE INDEX IF NOT EXISTS idx_media_company_ueid ON media_company_links(company_ueid);

-- ============================================================
-- Фінансові транзакції (для датасетів #70, #79)
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    company_ueid VARCHAR(64) NOT NULL,
    counterparty_ueid VARCHAR(64),
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    transaction_type VARCHAR(50),
    description TEXT,
    related_declaration_id UUID REFERENCES declarations(id),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_tenant ON financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fin_company ON financial_transactions(company_ueid);
CREATE INDEX IF NOT EXISTS idx_fin_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_fin_type ON financial_transactions(transaction_type);

-- ============================================================
-- Специфікації товарів (для датасетів #18, #34)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uktzed_code VARCHAR(20) NOT NULL,
    typical_weight_kg NUMERIC(18, 4),
    typical_volume_m3 NUMERIC(18, 4),
    typical_dimensions JSONB,
    typical_quantity_per_unit NUMERIC(10, 2),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_specs_uktzed ON product_specifications(uktzed_code);

-- ============================================================
-- Сезонність попиту (для датасету #14)
-- ============================================================
CREATE TABLE IF NOT EXISTS market_seasonality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uktzed_code VARCHAR(20) NOT NULL,
    month SMALLINT NOT NULL,
    demand_level VARCHAR(20),
    typical_volume NUMERIC(18, 2),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_season_uktzed ON market_seasonality(uktzed_code);
CREATE INDEX IF NOT EXISTS idx_season_month ON market_seasonality(month);

-- ============================================================
-- Логістичні дані портів (для датасету #24)
-- ============================================================
CREATE TABLE IF NOT EXISTS port_logistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    port_name VARCHAR(255) NOT NULL,
    port_code VARCHAR(50),
    country VARCHAR(100),
    annual_capacity_tons NUMERIC(18, 2),
    typical_handling_time_days NUMERIC(5, 2),
    infrastructure_type VARCHAR(100),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_port_name ON port_logistics(port_name);
CREATE INDEX IF NOT EXISTS idx_port_country ON port_logistics(country);

-- ============================================================
-- Реєстр упаковки (для датасету #34)
-- ============================================================
CREATE TABLE IF NOT EXISTS packaging_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packaging_type VARCHAR(255) NOT NULL,
    typical_cost_usd NUMERIC(10, 2),
    weight_kg NUMERIC(10, 4),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packaging_type ON packaging_registry(packaging_type);

-- ============================================================
-- Відстеження пільг (для датасету #39)
-- ============================================================
CREATE TABLE IF NOT EXISTS benefit_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benefit_code VARCHAR(50) NOT NULL,
    benefit_name VARCHAR(255),
    description TEXT,
    uktzed_codes_affected JSONB DEFAULT '[]',
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benefit_code ON benefit_tracking(benefit_code);

-- ============================================================
-- Статистика інфраструктури (для датасету #41)
-- ============================================================
CREATE TABLE IF NOT EXISTS infrastructure_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customs_post_code VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    staff_count INTEGER,
    infrastructure_capacity INTEGER,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_infra_post ON infrastructure_stats(customs_post_code);
CREATE INDEX IF NOT EXISTS idx_infra_year ON infrastructure_stats(year);

-- ============================================================
-- Донори та гранти (для датасету #42)
-- ============================================================
CREATE TABLE IF NOT EXISTS donations_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_ueid VARCHAR(64) NOT NULL,
    donation_date DATE NOT NULL,
    amount_usd NUMERIC(18, 2),
    recipient VARCHAR(255),
    purpose TEXT,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_company ON donations_grants(company_ueid);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations_grants(donation_date);

-- ============================================================
-- Перемоги в тендерах (для датасету #42)
-- ============================================================
CREATE TABLE IF NOT EXISTS tender_wins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_ueid VARCHAR(64) NOT NULL,
    tender_date DATE NOT NULL,
    tender_title VARCHAR(500),
    amount_usd NUMERIC(18, 2),
    procuring_entity VARCHAR(255),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tender_company ON tender_wins(company_ueid);
CREATE INDEX IF NOT EXISTS idx_tender_date ON tender_wins(tender_date);

-- ============================================================
-- Відстеження статусів декларацій (для датасету #45)
-- ============================================================
CREATE TABLE IF NOT EXISTS declaration_workflow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    declaration_id UUID NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    status_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_official_id UUID REFERENCES customs_officials(id),
    notes TEXT,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_declaration ON declaration_workflow(declaration_id);
CREATE INDEX IF NOT EXISTS idx_workflow_status ON declaration_workflow(status);
CREATE INDEX IF NOT EXISTS idx_workflow_date ON declaration_workflow(status_date);

-- ============================================================
-- Кадрові зміни (для датасету #47)
-- ============================================================
CREATE TABLE IF NOT EXISTS personnel_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    official_id UUID NOT NULL REFERENCES customs_officials(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL,
    change_date DATE NOT NULL,
    old_position VARCHAR(255),
    new_position VARCHAR(255),
    customs_post_code VARCHAR(50),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personnel_official ON personnel_changes(official_id);
CREATE INDEX IF NOT EXISTS idx_personnel_date ON personnel_changes(change_date);

-- ============================================================
-- Календар подій (для датасету #52)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_date DATE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(500),
    description TEXT,
    region VARCHAR(100),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_date ON event_calendar(event_date);
CREATE INDEX IF NOT EXISTS idx_event_type ON event_calendar(event_type);
CREATE INDEX IF NOT EXISTS idx_event_region ON event_calendar(region);

-- ============================================================
-- Дати релізу продуктів (для датасетів #58, #85)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_release_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(500) NOT NULL,
    brand_name VARCHAR(255),
    release_date DATE NOT NULL,
    manufacturer VARCHAR(255),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_release_name ON product_release_dates(product_name);
CREATE INDEX IF NOT EXISTS idx_release_brand ON product_release_dates(brand_name);
CREATE INDEX IF NOT EXISTS idx_release_date ON product_release_dates(release_date);

-- ============================================================
-- Умови оплати (для датасету #59)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    declaration_id UUID NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    payment_type VARCHAR(50),
    payment_term_days INTEGER,
    actual_payment_date DATE,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_declaration ON payment_terms(declaration_id);
CREATE INDEX IF NOT EXISTS idx_payment_actual_date ON payment_terms(actual_payment_date);

-- ============================================================
-- Відстані маршрутів (для датасету #62)
-- ============================================================
CREATE TABLE IF NOT EXISTS route_distances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_country VARCHAR(100) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    customs_post_code VARCHAR(50) NOT NULL,
    distance_km NUMERIC(10, 2),
    typical_travel_hours NUMERIC(5, 2),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_origin ON route_distances(origin_country);
CREATE INDEX IF NOT EXISTS idx_route_destination ON route_distances(destination_country);
CREATE INDEX IF NOT EXISTS idx_route_post ON route_distances(customs_post_code);

-- ============================================================
-- Статистика виробництва (для датасету #64)
-- ============================================================
CREATE TABLE IF NOT EXISTS production_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(3) NOT NULL,
    uktzed_code VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    production_volume NUMERIC(18, 2),
    production_value_usd NUMERIC(18, 2),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_country ON production_stats(country_code);
CREATE INDEX IF NOT EXISTS idx_prod_uktzed ON production_stats(uktzed_code);
CREATE INDEX IF NOT EXISTS idx_prod_year ON production_stats(year);

-- ============================================================
-- Система квот (для датасету #65)
-- ============================================================
CREATE TABLE IF NOT EXISTS quota_system (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quota_code VARCHAR(50) NOT NULL,
    quota_name VARCHAR(255),
    uktzed_codes_affected JSONB DEFAULT '[]',
    annual_limit NUMERIC(18, 2),
    current_usage NUMERIC(18, 2),
    effective_date DATE,
    expiry_date DATE,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quota_code ON quota_system(quota_code);
CREATE INDEX IF NOT EXISTS idx_quota_effective ON quota_system(effective_date);

-- ============================================================
-- Відстеження переробки (для датасету #72)
-- ============================================================
CREATE TABLE IF NOT EXISTS recycling_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    declaration_id UUID NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    recycling_facility VARCHAR(255),
    actual_recycling_date DATE,
    recycling_weight_kg NUMERIC(18, 4),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recycling_declaration ON recycling_tracking(declaration_id);
CREATE INDEX IF NOT EXISTS idx_recycling_date ON recycling_tracking(actual_recycling_date);

-- ============================================================
-- Внутрішні ціни продажу (для датасету #74)
-- ============================================================
CREATE TABLE IF NOT EXISTS domestic_sales_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_ueid VARCHAR(64) NOT NULL,
    uktzed_code VARCHAR(20) NOT NULL,
    sale_date DATE NOT NULL,
    price_per_unit_usd NUMERIC(18, 4),
    quantity NUMERIC(18, 4),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domestic_company ON domestic_sales_prices(company_ueid);
CREATE INDEX IF NOT EXISTS idx_domestic_uktzed ON domestic_sales_prices(uktzed_code);
CREATE INDEX IF NOT EXISTS idx_domestic_date ON domestic_sales_prices(sale_date);

-- ============================================================
-- Часи подорожі (для датасету #77)
-- ============================================================
CREATE TABLE IF NOT EXISTS travel_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_country VARCHAR(100) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    transport_mode VARCHAR(50),
    typical_hours NUMERIC(5, 2),
    minimum_hours NUMERIC(5, 2),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_travel_origin ON travel_times(origin_country);
CREATE INDEX IF NOT EXISTS idx_travel_destination ON travel_times(destination_country);

-- ============================================================
-- Валідація адрес (для датасету #80)
-- ============================================================
CREATE TABLE IF NOT EXISTS address_validation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address TEXT NOT NULL,
    is_valid BOOLEAN NOT NULL,
    validation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    normalized_address TEXT,
    coordinates JSONB,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addr_validation ON address_validation(is_valid);
CREATE INDEX IF NOT EXISTS idx_addr_date ON address_validation(validation_date);

-- ============================================================
-- IP адреси оформлення (для датасету #87)
-- ============================================================
CREATE TABLE IF NOT EXISTS declaration_ip_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    declaration_id UUID NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_declaration ON declaration_ip_addresses(declaration_id);
CREATE INDEX IF NOT EXISTS idx_ip_address ON declaration_ip_addresses(ip_address);

-- ============================================================
-- Тип інституції (для датасету #92)
-- ============================================================
CREATE TABLE IF NOT EXISTS institution_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_ueid VARCHAR(64) NOT NULL UNIQUE,
    institution_type VARCHAR(100) NOT NULL,
    sub_type VARCHAR(100),
    verification_date DATE,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inst_company ON institution_types(company_ueid);
CREATE INDEX IF NOT EXISTS idx_inst_type ON institution_types(institution_type);

-- ============================================================
-- Внутрішнє відстеження (для датасету #96)
-- ============================================================
CREATE TABLE IF NOT EXISTS domestic_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    declaration_id UUID NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    tracking_status VARCHAR(50),
    first_domestic_sale_date DATE,
    total_domestic_sales NUMERIC(18, 2),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domestic_tracking_declaration ON domestic_tracking(declaration_id);
CREATE INDEX IF NOT EXISTS idx_domestic_tracking_status ON domestic_tracking(tracking_status);

-- ============================================================
-- Регіональний попит (для датасету #99)
-- ============================================================
CREATE TABLE IF NOT EXISTS regional_demand (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region VARCHAR(100) NOT NULL,
    uktzed_code VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    month SMALLINT,
    estimated_demand NUMERIC(18, 2),
    population INTEGER,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_region ON regional_demand(region);
CREATE INDEX IF NOT EXISTS idx_demand_uktzed ON regional_demand(uktzed_code);
CREATE INDEX IF NOT EXISTS idx_demand_year ON regional_demand(year);

-- ============================================================
-- Реєстр ПЗ (для датасету #100)
-- ============================================================
CREATE TABLE IF NOT EXISTS software_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    software_name VARCHAR(500) NOT NULL,
    version VARCHAR(100),
    developer VARCHAR(255),
    registration_date DATE,
    copyright_holder VARCHAR(255),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_software_name ON software_registry(software_name);
CREATE INDEX IF NOT EXISTS idx_software_developer ON software_registry(developer);

-- ============================================================
-- Реєстр паспортів (для датасету #28)
-- ============================================================
CREATE TABLE IF NOT EXISTS passport_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_ueid VARCHAR(64) NOT NULL,
    passport_country VARCHAR(100) NOT NULL,
    passport_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passport_person ON passport_registrations(person_ueid);
CREATE INDEX IF NOT EXISTS idx_passport_country ON passport_registrations(passport_country);

-- ============================================================
-- Інфраструктурні проєкти (для датасету #95)
-- ============================================================
CREATE TABLE IF NOT EXISTS infrastructure_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(500) NOT NULL,
    project_type VARCHAR(100),
    region VARCHAR(100),
    planned_start_date DATE,
    planned_completion_date DATE,
    status VARCHAR(50),
    budget_usd NUMERIC(18, 2),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_name ON infrastructure_projects(project_name);
CREATE INDEX IF NOT EXISTS idx_project_region ON infrastructure_projects(region);
CREATE INDEX IF NOT EXISTS idx_project_status ON infrastructure_projects(status);

-- ============================================================
-- Відеомоніторинг КПП (для датасету #56)
-- ============================================================
CREATE TABLE IF NOT EXISTS video_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customs_post_code VARCHAR(50) NOT NULL,
    monitoring_date DATE NOT NULL,
    vehicle_count INTEGER,
    recording_count INTEGER,
    system_status VARCHAR(50),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_post ON video_monitoring(customs_post_code);
CREATE INDEX IF NOT EXISTS idx_video_date ON video_monitoring(monitoring_date);

-- ============================================================
-- Зовнішні посилання компаній (для датасету #28)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_offshore_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_ueid VARCHAR(64) NOT NULL,
    offshore_country VARCHAR(100) NOT NULL,
    offshore_entity_name VARCHAR(500),
    registration_date DATE,
    relationship_type VARCHAR(100),
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offshore_company ON company_offshore_links(company_ueid);
CREATE INDEX IF NOT EXISTS idx_offshore_country ON company_offshore_links(offshore_country);

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

INSERT INTO audit_log (event_type, description, user_id) 
VALUES ('SYSTEM_UPGRADE', 'Платформа оновлена до v63.0-ELITE (War-gaming Horizon). Впроваджено двигун стратегічного моделювання.', '00000000-0000-0000-0000-000000000000');

INSERT INTO audit_log (tenant_id, action, details)
VALUES ('a0000000-0000-0000-0000-000000000001', 'system_init',
        '{"message": "PREDATOR Analytics v62.0-ELITE ініціалізовано", "version": "62.0"}'::jsonb);
