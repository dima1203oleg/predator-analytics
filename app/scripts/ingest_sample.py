from __future__ import annotations

import asyncio
import sys
import uuid

# Add project root to sys.path
sys.path.append("/app")

from app.libs.core.database import get_db_ctx
from app.libs.core.models import Document
from app.services.test_data_generator import TestDataGenerator


async def ingest():
    generator = TestDataGenerator()
    batch = generator.generate_batch(row_count=50)

    async with get_db_ctx() as db:
        for i, record in enumerate(batch):
            # Inject anomalies for every 5th record
            if i % 4 == 0:
                record["tax_debtor"] = True
                record["years_active"] = 1
                record["sanctioned"] = True
                record["sector"] = "GOV"
            if i % 7 == 0:
                record["sanctioned"] = True

            title = f"Митна декларація {record['Номер декларації']}"
            content = f"Компанія: {record['Отримувач (назва)']} (ЄДРПОУ: {record['Отримувач (ЄДРПОУ)']}). Товар: {record['Опис товару']}. Вартість: {record['Митна вартість (USD)']} USD."

            doc = Document(
                id=uuid.uuid4(),
                tenant_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                title=title,
                content=content,
                source_type="CUSTOMS",
                meta=record,
            )
            db.add(doc)

        await db.commit()



if __name__ == "__main__":
    asyncio.run(ingest())
