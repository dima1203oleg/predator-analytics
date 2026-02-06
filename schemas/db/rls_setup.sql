
-- predator-analytics v25.1
-- PostgreSQL: Multi-Tenant Isolation / RLS (Section 3.1.3)

-- 1. Enable RLS on audit_ledger
ALTER TABLE audit_ledger ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy: Tenant can only see their own data
-- We assume the 'tenant_id' column exists in the table.
-- If not, let's add it first (defensive).
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_ledger' AND column_name='tenant_id') THEN
        ALTER TABLE audit_ledger ADD COLUMN tenant_id VARCHAR(50) DEFAULT 'default';
    END IF;
END $$;

DROP POLICY IF EXISTS tenant_isolation_policy ON audit_ledger;
CREATE POLICY tenant_isolation_policy ON audit_ledger
    FOR ALL
    TO PUBLIC
    USING (tenant_id = current_setting('app.current_tenant', true));

-- 3. Decision Matrix RLS (to be implemented if table exists)
-- ALTER TABLE rtb_decisions ENABLE ROW LEVEL SECURITY;
-- ...
