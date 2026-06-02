-- Оптимізація схеми бази даних для історичних даних митних декларацій
-- Підтримка 5-8 років історичних даних (60-96 місяців)
-- Оціночний обсяг: 237MB на місяць * 96 місяців = ~22.7GB

-- ============================================================
-- 1. Партиціонування таблиці declarations за місяцями
-- ============================================================

-- Створення парентової таблиці
CREATE TABLE IF NOT EXISTS declarations_historical (
    -- Всі колонки з оригінальної таблиці declarations
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    declaration_number VARCHAR(50),
    declaration_date DATE NOT NULL,
    customs_post VARCHAR(50),
    uktzed_code VARCHAR(20),
    goods_description TEXT,
    weight_kg NUMERIC(18, 3),
    value_usd NUMERIC(18, 2),
    price_per_unit_usd NUMERIC(18, 4),
    origin_country VARCHAR(100),
    destination_country VARCHAR(100),
    importer_ueid VARCHAR(64),
    importer_edrpou VARCHAR(10),
    exporter_name VARCHAR(500),
    declaration_type VARCHAR(50),
    regime VARCHAR(50),
    procedure_code VARCHAR(10),
    status VARCHAR(50) DEFAULT 'pending',
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL NOW()
) PARTITION BY RANGE (declaration_date);

-- Створення індексів для парентової таблиці
CREATE INDEX IF NOT EXISTS idx_hist_decl_tenant ON declarations_historical(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hist_decl_importer ON declarations_historical(importer_ueid);
CREATE INDEX IF NOT EXISTS idx_hist_decl_uktzed ON declarations_historical(uktzed_code);
CREATE INDEX IF NOT EXISTS idx_hist_decl_customs_post ON declarations_historical(customs_post);
CREATE INDEX IF NOT EXISTS idx_hist_decl_date ON declarations_historical(declaration_date);

-- Створення партицій для кожного місяця (приклад для 2024 року)
-- Цей скрипт потрібно виконати для кожного місяця за 5-8 років

-- Січень 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_01 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Лютий 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_02 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Березень 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_03 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Квітень 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_04 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');

-- Травень 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_05 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');

-- Червень 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_06 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

-- Липень 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_07 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');

-- Серпень 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_08 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

-- Вересень 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_09 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');

-- Жовтень 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_10 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

-- Листопад 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_11 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

-- Грудень 2024
CREATE TABLE IF NOT EXISTS declarations_historical_2024_12 PARTITION OF declarations_historical
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- ============================================================
-- 2. Створення таблиці для метаданих імпорту
-- ============================================================

CREATE TABLE IF NOT EXISTS import_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_hash VARCHAR(64),
    import_status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, completed, failed
    total_rows INTEGER,
    imported_rows INTEGER,
    failed_rows INTEGER,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    error_message TEXT,
    source VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_tenant ON import_metadata(tenant_id);
CREATE INDEX IF NOT EXISTS idx_import_status ON import_metadata(import_status);
CREATE INDEX IF NOT EXISTS idx_import_file_name ON import_metadata(file_name);
CREATE INDEX IF NOT EXISTS idx_import_file_hash ON import_metadata(file_hash);

-- ============================================================
-- 3. Оптимізація індексів для історичних даних
-- ============================================================

-- Часткові індекси для активних даних (останній рік)
CREATE INDEX IF NOT EXISTS idx_hist_decl_active_date 
    ON declarations_historical(declaration_date) 
    WHERE declaration_date >= CURRENT_DATE - INTERVAL '1 year';

-- BRIN індекс для великих таблиць (компактний для послідовних даних)
CREATE INDEX IF NOT EXISTS idx_hist_decl_date_brin 
    ON declarations_historical USING BRIN (declaration_date);

-- GIN індекс для JSONB даних (якщо використовуються)
CREATE INDEX IF NOT EXISTS idx_hist_decl_raw_data_gin 
    ON declarations_historical USING GIN (raw_data);

-- ============================================================
-- 4. Створення матеріалізованих представлень для аналітики
-- ============================================================

-- Щомісячна статистика імпорту
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_import_stats AS
SELECT 
    DATE_TRUNC('month', declaration_date) AS month,
    COUNT(*) AS total_declarations,
    SUM(value_usd) AS total_value_usd,
    SUM(weight_kg) AS total_weight_kg,
    COUNT(DISTINCT importer_ueid) AS unique_importers,
    COUNT(DISTINCT uktzed_code) AS unique_uktzed_codes,
    COUNT(DISTINCT customs_post) AS unique_customs_posts
FROM declarations_historical
GROUP BY DATE_TRUNC('month', declaration_date)
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_stats_month ON monthly_import_stats(month);

-- Щомісячна статистика по УКТЗЕД кодах
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_uktzed_stats AS
SELECT 
    DATE_TRUNC('month', declaration_date) AS month,
    uktzed_code,
    COUNT(*) AS total_declarations,
    SUM(value_usd) AS total_value_usd,
    AVG(value_usd) AS avg_value_usd,
    SUM(weight_kg) AS total_weight_kg
FROM declarations_historical
GROUP BY DATE_TRUNC('month', declaration_date), uktzed_code
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_monthly_uktzed_month ON monthly_uktzed_stats(month);
CREATE INDEX IF NOT EXISTS idx_monthly_uktzed_code ON monthly_uktzed_stats(uktzed_code);

-- ============================================================
-- 5. Створення функції для автоматичного створення партицій
-- ============================================================

CREATE OR REPLACE FUNCTION create_monthly_partition(
    p_year INTEGER,
    p_month INTEGER
) RETURNS VOID AS $$
DECLARE
    v_partition_name TEXT;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    v_partition_name := 'declarations_historical_' || p_year || '_' || LPAD(p_month::TEXT, 2, '0');
    v_start_date := MAKE_DATE(p_year, p_month, 1);
    v_end_date := v_start_date + INTERVAL '1 month';
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF declarations_historical FOR VALUES FROM (%L) TO (%L)',
        v_partition_name,
        v_start_date,
        v_end_date
    );
    
    RAISE NOTICE 'Created partition: %', v_partition_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. Створення функції для оновлення матеріалізованих представлень
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_historical_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_import_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_uktzed_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. Налаштування автозбирання (VACUUM) для історичних даних
-- ============================================================

-- Автовакуум налаштування для великих таблиць
ALTER TABLE declarations_historical SET (
    autovacuum_enabled = true,
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_threshold = 10000
);

-- ============================================================
-- 8. Створення таблиці для архівування старих даних
-- ============================================================

CREATE TABLE IF NOT EXISTS declarations_archive (
    -- Така ж структура як declarations_historical
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    declaration_number VARCHAR(50),
    declaration_date DATE NOT NULL,
    customs_post VARCHAR(50),
    uktzed_code VARCHAR(20),
    goods_description TEXT,
    weight_kg NUMERIC(18, 3),
    value_usd NUMERIC(18, 2),
    price_per_unit_usd NUMERIC(18, 4),
    origin_country VARCHAR(100),
    destination_country VARCHAR(100),
    importer_ueid VARCHAR(64),
    importer_edrpou VARCHAR(10),
    exporter_name VARCHAR(500),
    declaration_type VARCHAR(50),
    regime VARCHAR(50),
    procedure_code VARCHAR(10),
    status VARCHAR(50),
    raw_data JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- Індекси для архівної таблиці
CREATE INDEX IF NOT EXISTS idx_archive_date ON declarations_archive(declaration_date);
CREATE INDEX IF NOT EXISTS idx_archive_importer ON declarations_archive(importer_ueid);
CREATE INDEX IF NOT EXISTS idx_archive_uktzed ON declarations_archive(uktzed_code);

-- ============================================================
-- 9. Створення тригера для автоматичного переміщення старих даних в архів
-- ============================================================

CREATE OR REPLACE FUNCTION archive_old_declarations()
RETURNS VOID AS $$
BEGIN
    -- Переміщення даних старших за 5 років в архів
    INSERT INTO declarations_archive
    SELECT *, NOW() AS archived_at
    FROM declarations_historical
    WHERE declaration_date < CURRENT_DATE - INTERVAL '5 years'
    ON CONFLICT (id) DO NOTHING;
    
    -- Видалення заархівованих даних
    DELETE FROM declarations_historical
    WHERE declaration_date < CURRENT_DATE - INTERVAL '5 years';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 10. Налаштування Row-Level Security для історичних даних
-- ============================================================

ALTER TABLE declarations_historical ENABLE ROW LEVEL SECURITY;

-- Політика для читання
CREATE POLICY IF NOT EXISTS "tenant_can_read_historical"
    ON declarations_historical FOR SELECT
    USING (tenant_id IN (SELECT id FROM current_tenant()));

-- Політика для вставки
CREATE POLICY IF NOT EXISTS "tenant_can_insert_historical"
    ON declarations_historical FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM current_tenant()));

-- ============================================================
-- 11. Створення функції для моніторингу розміру партицій
-- ============================================================

CREATE OR REPLACE FUNCTION get_partition_sizes()
RETURNS TABLE (
    partition_name TEXT,
    row_count BIGINT,
    total_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename AS partition_name,
        n_live_tup AS row_count,
        pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size
    FROM pg_stat_user_tables
    WHERE tablename LIKE 'declarations_historical_%'
    ORDER BY tablename;
END;
$$ LANGUAGE plpgsql;
