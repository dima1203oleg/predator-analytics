import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from predator_common.models import Person, Company

async def check_db():
    engine = create_async_engine("postgresql+asyncpg://predator:predator_secret@194.177.1.240:5432/predator_analytics")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Searching for Person by INN: 3111724753")
        stmt = select(Person).where(Person.inn == "3111724753")
        result = await session.execute(stmt)
        persons = result.scalars().all()
        for p in persons:
            print(f"Found: {p.full_name}, {p.date_of_birth}, UEID: {p.ueid}")
            
        print("Searching for Person by Name: Кізима Дмитро Миколайович")
        stmt2 = select(Person).where(Person.full_name.ilike("%Кізима Дмитро%"))
        result2 = await session.execute(stmt2)
        persons2 = result2.scalars().all()
        for p in persons2:
            print(f"Found by name: {p.full_name}, INN: {p.inn}")

if __name__ == "__main__":
    asyncio.run(check_db())
