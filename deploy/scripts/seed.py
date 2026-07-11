import asyncio
import os
import json
import random
import uuid
import asyncpg

POSTGRES_URL = os.getenv(
    "POSTGRES_URL", 
    "postgresql://predator:predator_secret@localhost:5432/predator_analytics"
)

TYPES = ["person", "company", "country", "offshore", "contract", "case", "customs"]

async def main():
    print("Connecting to DB to seed graph nodes...")
    conn = await asyncpg.connect(POSTGRES_URL)
    
    # Ensure table exists
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS entities (
            id VARCHAR(255) PRIMARY KEY,
            type VARCHAR(50),
            risk_score FLOAT DEFAULT 0.0,
            metadata JSONB
        )
    """)
    
    # Check if empty
    count = await conn.fetchval("SELECT COUNT(*) FROM entities")
    if count > 0:
        print(f"Database already has {count} entities. Skipping seed.")
        await conn.close()
        return

    print("Seeding 50 nodes...")
    for _ in range(50):
        entity_id = f"mock_{uuid.uuid4().hex[:8]}"
        t = random.choice(TYPES)
        risk = round(random.uniform(0.1, 0.9), 2)
        meta = json.dumps({"name": f"Entity {entity_id[-4:]}", "source": "seed_script"})
        
        await conn.execute("""
            INSERT INTO entities (id, type, risk_score, metadata)
            VALUES ($1, $2, $3, $4)
        """, entity_id, t, risk, meta)
        
    print("Seeding complete!")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
