-- init_autonomous_db.sql
-- Створення структури для State Machine автономного ланцюжка

CREATE TABLE IF NOT EXISTS predator_autonomous_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255), -- ID з Telegram або іншої системи
    status VARCHAR(50) CHECK (status IN (
        'RECEIVED',
        'PLANNING',
        'PLANNED',
        'CODING',
        'CODED',
        'VERIFYING',
        'VERIFIED',
        'POLICY_CHECK',
        'APPROVED',
        'EXECUTING',
        'EXECUTED',
        'OBSERVING',
        'COMPLETED',
        'FAILED',
        'BLOCKED'
    )),
    source VARCHAR(50) DEFAULT 'telegram',
    original_query TEXT,
    plan_text TEXT,
    generated_code TEXT,
    verified_code TEXT,
    policy_violations JSONB,
    execution_log TEXT,
    execution_mode VARCHAR(50) DEFAULT 'dry-run', -- dry-run, sandbox-execute, auto-fix, create-pr
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Індекси
CREATE INDEX IF NOT EXISTS idx_predator_tasks_status ON predator_autonomous_tasks(status)
WHERE status NOT IN ('COMPLETED', 'FAILED', 'BLOCKED');

CREATE INDEX IF NOT EXISTS idx_predator_tasks_ext_id ON predator_autonomous_tasks(external_id);
