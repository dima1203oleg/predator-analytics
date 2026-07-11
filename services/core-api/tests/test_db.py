import asyncio
from sqlalchemy import select
from app.database import SessionLocal
from app.models.risk import RiskScore

async def main():
    async with SessionLocal() as db:
        result = await db.execute(select(RiskScore).limit(10))
        scores = result.scalars().all()
        print(f"Risk scores count: {len(scores)}")
        for s in scores:
            print(s.entity_ueid, s.cers)

asyncio.run(main())
