-- PREDATOR Analytics v60.0-ELITE
-- ClickHouse OLAP Schema Initialization

CREATE DATABASE IF NOT EXISTS predator_analytics;

-- Основна таблиця аналітики митних декларацій
CREATE TABLE IF NOT EXISTS predator_analytics.customs_declarations (
    id UUID,
    declaration_number String,
    declaration_date Date,
    exporter_name String,
    exporter_ueid String,
    importer_name String,
    importer_ueid String,
    hs_code String, -- Код товару
    hs_description String,
    weight_kg Float64,
    value_usd Float64,
    origin_country LowCardinality(String),
    destination_country LowCardinality(String),
    customs_post_code String,
    risk_score Float32,
    ingested_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(declaration_date)
ORDER BY (declaration_date, hs_code, importer_ueid)
SETTINGS index_granularity = 8192;

-- Таблиця для агрегації ризиків по компаніях (Materialized View Source)
CREATE TABLE IF NOT EXISTS predator_analytics.company_risk_metrics (
    company_ueid String,
    total_value_usd AggregateFunction(sum, Float64),
    avg_risk_score AggregateFunction(avg, Float32),
    declaration_count AggregateFunction(count, UInt64),
    last_update SimpleAggregateFunction(max, DateTime)
) ENGINE = AggregatingMergeTree()
ORDER BY (company_ueid);

-- Журнал системних подій для аналітики продуктивності
CREATE TABLE IF NOT EXISTS predator_analytics.system_events (
    event_time DateTime,
    event_type LowCardinality(String),
    service_name LowCardinality(String),
    payload String,
    duration_ms UInt32
) ENGINE = MergeTree()
PARTITION BY toDate(event_time)
ORDER BY (event_time, event_type);
