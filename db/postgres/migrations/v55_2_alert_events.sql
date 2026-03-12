-- PREDATOR Analytics v55.2-SM-EXTENDED
-- Міграція: Додавання таблиці alert_events та оновлення alerts
-- Дата: 2026-03-11
-- ============================================================

-- Транзакція для атомарності
BEGIN;

-- ============================================================
-- 1. Оновлення таблиці alerts
-- ============================================================
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS condition_config JSONB DEFAULT '{}';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS actions JSONB DEFAULT '[]';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 2. Створення таблиці alert_events (§2.3.1)
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

-- Індекси
CREATE INDEX IF NOT EXISTS idx_alert_events_alert ON alert_events(alert_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_events_entity ON alert_events(entity_ueid, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_events_tenant ON alert_events(tenant_id);

-- ============================================================
-- 3. Row-Level Security для alert_events
-- ============================================================
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_alert_events ON alert_events;
CREATE POLICY tenant_isolation_alert_events ON alert_events
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- ============================================================
-- 4. Оновлення decision_artifacts (§2.3.1)
-- ============================================================
ALTER TABLE decision_artifacts ADD COLUMN IF NOT EXISTS trace_id VARCHAR(64);
ALTER TABLE decision_artifacts ADD COLUMN IF NOT EXISTS model_id VARCHAR(128);
ALTER TABLE decision_artifacts ADD COLUMN IF NOT EXISTS input_context_hash VARCHAR(64);
ALTER TABLE decision_artifacts ADD COLUMN IF NOT EXISTS output_payload JSONB;
ALTER TABLE decision_artifacts ADD COLUMN IF NOT EXISTS confidence_score FLOAT;
ALTER TABLE decision_artifacts ADD COLUMN IF NOT EXISTS supporting_sources JSONB DEFAULT '[]';
ALTER TABLE decision_artifacts ADD COLUMN IF NOT EXISTS explanation JSONB;
ALTER TABLE decision_artifacts ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE decision_artifacts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_decision_artifacts_trace_id ON decision_artifacts(trace_id);

-- ============================================================
-- 5. Версія міграції
-- ============================================================
INSERT INTO alembic_version (version_num) VALUES ('v55_2_alert_events')
ON CONFLICT DO NOTHING;

COMMIT;

-- Виведення результату
SELECT 'Міграція v55.2 alert_events успішно застосована' AS status;
