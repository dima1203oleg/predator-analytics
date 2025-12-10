-- Minimal DB schema for Predator Analytics v22
-- Create tables: documents, augmented_datasets, ml_datasets, ml_jobs, multimodal_assets, si_cycles

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT,
  content TEXT,
  source_type VARCHAR(50),
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents (tenant_id);

CREATE TABLE IF NOT EXISTS augmented_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  original_id UUID REFERENCES documents(id),
  content TEXT,
  aug_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_augmented_tenant ON augmented_datasets (tenant_id);

CREATE TABLE IF NOT EXISTS ml_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  dvc_path TEXT NOT NULL,
  size_rows INT,
  tags TEXT[],
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ml_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  dataset_id UUID REFERENCES ml_datasets(id),
  target VARCHAR(50),
  status VARCHAR(30),
  metrics JSONB,
  model_ref TEXT,
  si_cycle_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS multimodal_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  doc_id UUID REFERENCES documents(id),
  asset_type VARCHAR(20),
  uri TEXT,
  embedding_version INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS si_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  trigger_type VARCHAR(50),
  diagnostic_ref TEXT,
  dataset_ref TEXT,
  mlflow_run_id TEXT,
  status VARCHAR(30),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
