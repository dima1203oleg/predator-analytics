-- Predator Analytics v21.0 Database Initialization

-- 1. Create Schemas
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS gold;

-- 2. Staging Layer (Raw Data)
CREATE TABLE IF NOT EXISTS staging.raw_data (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL, -- 'web', 'api', 'file'
    source_url TEXT,
    raw_content JSONB NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    retry_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_staging_processed ON staging.raw_data(processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_staging_source ON staging.raw_data(source_type);

-- 3. Gold Layer (Cleaned Documents)
CREATE TABLE IF NOT EXISTS gold.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    author VARCHAR(255),
    published_date TIMESTAMPTZ,
    source_url TEXT,
    category VARCHAR(100),
    language VARCHAR(10) DEFAULT 'uk',
    
    -- Metadata
    raw_id INT REFERENCES staging.raw_data(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexing Status
    indexed_os BOOLEAN DEFAULT FALSE, -- OpenSearch
    indexed_vec BOOLEAN DEFAULT FALSE -- Qdrant
);

CREATE INDEX IF NOT EXISTS idx_gold_category ON gold.documents(category);
CREATE INDEX IF NOT EXISTS idx_gold_pub_date ON gold.documents(published_date);
CREATE INDEX IF NOT EXISTS idx_gold_indexing ON gold.documents(indexed_os, indexed_vec);

-- 4. Users & Auth (Optional for MVP, but good to have structure)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user', -- 'admin', 'user'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Search Logs (Analytics)
CREATE TABLE IF NOT EXISTS gold.search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    query TEXT NOT NULL,
    filters JSONB,
    results_count INT,
    search_type VARCHAR(20), -- 'text', 'semantic', 'hybrid'
    execution_time_ms FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Grant permissions (Adjust 'predator' user as needed)
-- GRANT ALL PRIVILEGES ON SCHEMA staging TO predator;
-- GRANT ALL PRIVILEGES ON SCHEMA gold TO predator;
