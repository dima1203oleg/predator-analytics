from __future__ import annotations

import asyncio
import sys

# Add project root to sys.path
sys.path.append("/app")

from app.libs.core.database import get_db_ctx
from app.libs.core.models import Document
from app.services.graph_service import graph_builder


async def build_all_graphs():
    tenant_id = "00000000-0000-0000-0000-000000000000"

    async with get_db_ctx() as db:
        stmt = select(Document).limit(10)  # process first 10 for demo speed
        result = await db.execute(stmt)
        docs = result.scalars().all()


        for doc in docs:
            try:
                # Force extract graph data
                result = await graph_builder.extract_and_build(
                    doc_id=str(doc.id), text=doc.content, tenant_id=tenant_id
                )
                if result:
                    pass
            except Exception:
                pass



if __name__ == "__main__":
    from sqlalchemy import select

    asyncio.run(build_all_graphs())
