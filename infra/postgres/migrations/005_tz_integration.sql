-- ================================================================
-- Database Migrations for TZ Integration (v21.1)
-- Created: 2025-12-06
-- Purpose: Add tables for ML features, integrations, and analytics
-- ================================================================

-- ---------------------------------------------------------------
-- 1. User Tokens Table (for OAuth integrations)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_tokens (
    user_id UUID NOT NULL,
    service VARCHAR(50) NOT NULL,  -- 'slack', 'notion', 'google_drive'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    extra JSONB,  -- Service-specific metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY(user_id, service)
);

CREATE INDEX idx_user_tokens_service ON user_tokens(service);

COMMENT ON TABLE user_tokens IS 'OAuth2 tokens for third-party integrations';

-- ---------------------------------------------------------------
-- 2. Search Logs Table (for analytics and ML training)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,  -- NULL for anonymous searches
    query TEXT NOT NULL,
    filters JSONB,  -- e.g., {"category": "news", "date_from": "2024-01-01"}
    results_count INT DEFAULT 0,
    latency_ms INT,  -- Backend processing time
    semantic_enabled BOOLEAN DEFAULT FALSE,
    rerank_enabled BOOLEAN DEFAULT FALSE,
    clicked_document_id UUID,  -- First clicked result (for CTR)
    clicked_position INT,  -- Position in results (1-indexed)
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_logs_user ON search_logs(user_id, created_at DESC);
CREATE INDEX idx_search_logs_time ON search_logs(created_at DESC);
CREATE INDEX idx_search_logs_query_hash ON search_logs(md5(query));

COMMENT ON TABLE search_logs IS 'Search query logs for analytics and ML optimization';

-- ---------------------------------------------------------------
-- 3. Document Summaries Cache
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_summaries (
    document_id UUID PRIMARY KEY REFERENCES gold.documents(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    model_name VARCHAR(100) DEFAULT 'bart-large-cnn',
    generated_at TIMESTAMP DEFAULT NOW(),
    word_count INT,  -- Summary length
    expires_at TIMESTAMP  -- Optional TTL for cache invalidation
);

CREATE INDEX idx_summaries_expires ON document_summaries(expires_at) 
WHERE expires_at IS NOT NULL;

COMMENT ON TABLE document_summaries IS 'Cached document summaries from ML service';

-- ---------------------------------------------------------------
-- 4. ML Model Metadata (for tracking deployed models)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type VARCHAR(50) NOT NULL,  -- 'reranker', 'summarizer', 'embedder'
    model_name VARCHAR(200) NOT NULL,
    version VARCHAR(50),
    deployed_at TIMESTAMP DEFAULT NOW(),
    metrics JSONB,  -- e.g., {"ndcg@10": 0.85, "latency_p95": 120}
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

CREATE INDEX idx_ml_models_type ON ml_models(model_type, is_active);

COMMENT ON TABLE ml_models IS 'Registry of deployed ML models';

-- ---------------------------------------------------------------
-- 5. Rate Limiting Counters (Redis alternative for persistence)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
    user_id UUID NOT NULL,
    resource VARCHAR(50) NOT NULL,  -- 'search', 'export', etc.
    count INT DEFAULT 0,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    PRIMARY KEY(user_id, resource, window_start)
);

CREATE INDEX idx_rate_limits_window ON rate_limits(window_end) 
WHERE window_end > NOW();

COMMENT ON TABLE rate_limits IS 'Persistent rate limit counters (backup for Redis)';

-- ---------------------------------------------------------------
-- 6. Analytics Events (generic event tracking)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,  -- 'export_notion', 'share_slack', etc.
    user_id UUID,
    payload JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);

COMMENT ON TABLE analytics_events IS 'Generic event tracking for business analytics';

-- ---------------------------------------------------------------
-- GRANTS (adjust as needed)
-- ---------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predator;
