-- migrations/002_customs_schema.sql
-- Production Schema for Customs Intelligence (Section 5.1)

CREATE SCHEMA IF NOT EXISTS customs;

-- 1. DECLARATIONS (CORE)
CREATE TABLE IF NOT EXISTS customs.declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    declaration_number VARCHAR(255) UNIQUE NOT NULL,
    declaration_date DATE,
    customs_office VARCHAR(500),
    regime VARCHAR(50), -- IM, EK, etc.
    import_export_flag VARCHAR(10),
    total_value DECIMAL(20, 2),
    currency VARCHAR(10),
    total_weight_kg DECIMAL(20, 4),
    raw_id UUID, -- Reference to staging.raw_data
    row_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PARTICIPANTS (COMPANIES/BROKERS)
CREATE TABLE IF NOT EXISTS customs.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code VARCHAR(50), -- EDRPOU or foreign ID
    country_iso VARCHAR(10),
    type VARCHAR(50), -- IMPORTER, EXPORTER, BROKER, CARRIER
    address TEXT,
    normalized_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DECLARATION PARTICIPATION (Mapping)
CREATE TABLE IF NOT EXISTS customs.declaration_participants (
    declaration_id UUID REFERENCES customs.declarations(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES customs.participants(id) ON DELETE CASCADE,
    role VARCHAR(50), -- IMPORTER, EXPORTER, BROKER, CARRIER
    PRIMARY KEY (declaration_id, participant_id, role)
);

-- 4. GOODS
CREATE TABLE IF NOT EXISTS customs.goods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    declaration_id UUID REFERENCES customs.declarations(id) ON DELETE CASCADE,
    hs_code VARCHAR(20) NOT NULL,
    description TEXT,
    quantity DECIMAL(20, 4),
    unit VARCHAR(50),
    net_weight_kg DECIMAL(20, 4),
    gross_weight_kg DECIMAL(20, 4),
    unit_price DECIMAL(20, 4),
    customs_value DECIMAL(20, 2),
    invoice_value DECIMAL(20, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TELEGRAM LINKING (Section 6.3)
CREATE TABLE IF NOT EXISTS customs.telegram_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_message_id UUID NOT NULL, -- Reference to gold.documents (transformed telegram msg)
    target_id UUID NOT NULL, -- ID of declaration or company
    target_type VARCHAR(50), -- DECLARATION, COMPANY
    sentiment VARCHAR(20), -- POSITIVE, NEGATIVE, NEUTRAL
    extraction_meta JSONB, -- Confidence, matched tokens
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for Search & Join Performance
CREATE INDEX IF NOT EXISTS idx_customs_decl_num ON customs.declarations(declaration_number);
CREATE INDEX IF NOT EXISTS idx_customs_part_code ON customs.participants(code);
CREATE INDEX IF NOT EXISTS idx_customs_goods_hs ON customs.goods(hs_code);
CREATE INDEX IF NOT EXISTS idx_customs_part_norm ON customs.participants(normalized_name);
