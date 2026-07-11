import asyncio
import asyncpg
from app.config import get_settings

async def main():
    settings = get_settings()
    conn = await asyncpg.connect(settings.async_database_url.replace("+asyncpg", ""))
    await conn.execute("""
    CREATE TABLE IF NOT EXISTS ingestion_quarantine (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        job_id UUID NOT NULL REFERENCES ingestion_jobs(id),
        original_record JSONB,
        errors JSONB,
        quarantined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """)
    await conn.close()
    print("Table created successfully")

asyncio.run(main())
