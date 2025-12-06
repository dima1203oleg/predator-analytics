-- Predator Analytics v21.0 Database Schema
-- Based on Semantic Search Platform TS

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;  -- For pgvector if installed

-- ============================================================================
-- 1. STAGING SCHEMA (Raw Data)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS staging;

CREATE TABLE IF NOT EXISTS staging.raw_data (
    id SERIAL PRIMARY KEY,
    source VARCHAR(255) NOT NULL,
    raw_content JSONB,
    fetched_at TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    error TEXT,
    dataset_type VARCHAR(100) -- To distinguishing uploads
);

CREATE INDEX IF NOT EXISTS idx_raw_data_processed ON staging.raw_data(processed);

-- ============================================================================
-- 2. GOLD SCHEMA (Processed Documents)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS gold;

CREATE TABLE IF NOT EXISTS gold.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    content TEXT,
    author VARCHAR(255),
    published_date TIMESTAMP,
    category VARCHAR(100),
    source VARCHAR(100),
    raw_id INT REFERENCES staging.raw_data(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_title ON gold.documents USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_docs_published ON gold.documents(published_date);
CREATE INDEX IF NOT EXISTS idx_docs_category ON gold.documents(category);

-- Optional: Embeddings table (if storing in Postgres alongside Qdrant/OpenSearch)
CREATE TABLE IF NOT EXISTS gold.embeddings (
    doc_id UUID PRIMARY KEY REFERENCES gold.documents(id) ON DELETE CASCADE,
    embedding vector(384), -- Requires pgvector
    model VARCHAR(100),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 3. USERS MANAGEMENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS gold.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- admin, analyst, viewer
    subscription_level VARCHAR(50) DEFAULT 'free',
    can_view_pii BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Initial Admin User (password: admin123)
-- Hash generated for demo purposes
INSERT INTO gold.users (username, email, role, subscription_level, can_view_pii)
VALUES ('admin', 'admin@predator.com', 'admin', 'pro', TRUE)
ON CONFLICT (email) DO NOTHING;
