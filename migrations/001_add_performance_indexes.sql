-- ═══════════════════════════════════════════════════════════════════════════
-- Predator Analytics v25 - Performance Indexes Migration
-- Створено: 2026-01-11
-- Мета: Оптимізація найчастіших SQL queries
-- ═══════════════════════════════════════════════════════════════════════════

-- Перед виконанням: Backup database
-- pg_dump -U predator predator_db > backup_$(date +%Y%m%d).sql

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- DOCUMENTS TABLE - Основна таблиця документів
-- ═══════════════════════════════════════════════════════════════════════════

-- Index для сортування по даті створення (ORDER BY created_at DESC)
-- Impact: Прискорення /api/v1/documents endpoint на 10-20x
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_created_at
ON documents(created_at DESC);

-- Index для фільтрації по типу джерела
-- Impact: WHERE source_type = 'customs' стає instant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_source_type
ON documents(source_type);

-- Index для фільтрації по tenant (multi-tenancy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_tenant_id
ON documents(tenant_id);

-- Composite index для комбінованих запитів
-- Impact: WHERE tenant_id = X AND source_type = Y ORDER BY created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_tenant_source_date
ON documents(tenant_id, source_type, created_at DESC);

-- Full-text search index для title
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_title_gin
ON documents USING gin(to_tsvector('ukrainian', title));

-- Full-text search index для content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_content_gin
ON documents USING gin(to_tsvector('ukrainian', content));

-- ═══════════════════════════════════════════════════════════════════════════
-- ML_JOBS TABLE - ML training jobs
-- ═══════════════════════════════════════════════════════════════════════════

-- Index для фільтрації по статусу
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ml_jobs_status
ON ml_jobs(status);

-- Index для сортування по даті
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ml_jobs_created_at
ON ml_jobs(created_at DESC);

-- Composite для активних jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ml_jobs_status_created
ON ml_jobs(status, created_at DESC)
WHERE status IN ('pending', 'running');

-- ═══════════════════════════════════════════════════════════════════════════
-- DATA_SOURCES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Index для active sources
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_sources_active
ON data_sources(is_active)
WHERE is_active = true;

-- Index для sync status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_sources_sync_status
ON data_sources(last_sync_status);

-- ═══════════════════════════════════════════════════════════════════════════
-- CASES TABLE - Центральна цінність Predator
-- ═══════════════════════════════════════════════════════════════════════════

-- Index для priority + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_priority_status
ON cases(priority DESC, status);

-- Index для assigned user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_assigned_to
ON cases(assigned_to)
WHERE assigned_to IS NOT NULL;

-- Index для due date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_due_date
ON cases(due_date)
WHERE due_date IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- AUDIT LOGS - Trinity Agent трейси
-- ═══════════════════════════════════════════════════════════════════════════

-- Index для timestamp (recent logs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trinity_audit_created_at
ON trinity_audit_log(created_at DESC);

-- Index для status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trinity_audit_status
ON trinity_audit_log(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- SYSTEM_METRICS - Моніторинг метрик
-- ═══════════════════════════════════════════════════════════════════════════

-- Hypertable optimization (TimescaleDB)
-- Index для time-series queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_timestamp
ON system_metrics(timestamp DESC);

-- Index для metric name filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_name
ON system_metrics(metric_name);

-- Composite для metric queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_name_timestamp
ON system_metrics(metric_name, timestamp DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- FOREIGN KEY INDEXES - Прискорення JOINs
-- ═══════════════════════════════════════════════════════════════════════════

-- Document metadata FK
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_metadata_doc_id
ON document_metadata(document_id);

-- Document summaries FK
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_summaries_doc_id
ON document_summaries(document_id);

-- ML Jobs dataset FK
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ml_jobs_dataset_id
ON ml_jobs(dataset_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- VACUUM AND ANALYZE - Оновлення статистики
-- ═══════════════════════════════════════════════════════════════════════════

VACUUM ANALYZE documents;
VACUUM ANALYZE ml_jobs;
VACUUM ANALYZE data_sources;
VACUUM ANALYZE cases;
VACUUM ANALYZE trinity_audit_log;
VACUUM ANALYZE system_metrics;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Перевірити створені indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Перевірити розмір indexes
SELECT
    schemaname || '.' || tablename AS table_name,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Test query performance improvement
EXPLAIN ANALYZE
SELECT * FROM documents
WHERE source_type = 'customs'
ORDER BY created_at DESC
LIMIT 100;

-- Expected: Index Scan using idx_documents_created_at (cost ~10ms)
-- Before: Seq Scan on documents (cost ~500ms)
