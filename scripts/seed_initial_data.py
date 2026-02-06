from __future__ import annotations

import asyncio
from datetime import datetime
import uuid

import asyncpg


DATABASE_URL = "postgresql://predator:predator_password@localhost:5432/predator_db"

async def seed():
    print("🌱 Seeding initial data...")
    conn = await asyncpg.connect(DATABASE_URL)

    tenant_id = uuid.UUID("00000000-0000-0000-0000-000000000000") # Admin tenant

    # 1. Add a document
    doc_id = uuid.uuid4()
    await conn.execute("""
        INSERT INTO public.documents (id, tenant_id, title, content, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
    """, doc_id, tenant_id, "Predator Analytics v25.0 Deployment Info",
    "System successfully deployed on NVIDIA Server. Core components: OpenSearch, Qdrant, PostgreSQL, Celery, H2O LLM Studio.",
    "system", datetime.now())

    # 2. Add an augmented example
    await conn.execute("""
        INSERT INTO public.augmented_datasets (id, tenant_id, original_id, content, aug_type)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
    """, uuid.uuid4(), tenant_id, doc_id, "Система Predator v25.0 успішно розгорнута на сервері NVIDIA.", "paraphrase")

    print("✅ Seed complete.")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(seed())
