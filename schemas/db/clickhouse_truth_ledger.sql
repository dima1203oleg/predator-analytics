
-- predator-analytics v25.1
-- ClickHouse Schema: Truth Ledger (Section 3.1.2)
-- High-throughput immutable storage for analytical events.

CREATE TABLE IF NOT EXISTS predator_truth_ledger (
    event_id UUID,
    event_type LowCardinality(String),
    timestamp DateTime64(3, 'UTC'),
    source LowCardinality(String),
    tenant_id LowCardinality(String),
    correlation_id UUID,
    payload String, -- JSON payload
    metric_value Float64 DEFAULT 0,
    integrity_hash FixedString(64),
    
    -- Projection for fast filtering
    PROJECTION p_event_type (
        SELECT event_type, count() GROUP BY event_type
    )
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, timestamp, event_type);

-- Materialized View for realtime performance stats
CREATE MATERIALIZED VIEW IF NOT EXISTS model_performance_stats
ENGINE = SummingMergeTree()
ORDER BY (tenant_id, event_type, toStartOfHour(timestamp))
AS SELECT
    tenant_id,
    event_type,
    toStartOfHour(timestamp) as hour,
    count() as total_events,
    avg(metric_value) as avg_metric
FROM predator_truth_ledger
GROUP BY tenant_id, event_type, hour;
