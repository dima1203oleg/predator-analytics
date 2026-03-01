from __future__ import annotations

import asyncio
import sys


# Add project root to sys.path
sys.path.append("/app")

from app.libs.core.database import get_db_ctx
from app.libs.core.models import Document
from app.services.graph_service import graph_builder


async def build_all_graphs():
    print("🕸️ Starting Bulk Graph Extraction (v45)...")
    tenant_id = "00000000-0000-0000-0000-000000000000"

    async with get_db_ctx() as db:
        stmt = select(Document).limit(10)  # process first 10 for demo speed
        result = await db.execute(stmt)
        docs = result.scalars().all()

        print(f"Found {len(docs)} documents to process.")

        for doc in docs:
            print(f"Processing doc: {doc.title} ({doc.id})")
            try:
                # Force extract graph data
                result = await graph_builder.extract_and_build(
                    doc_id=str(doc.id), text=doc.content, tenant_id=tenant_id
                )
                if result:
                    print(f"  ✅ Extracted {len(result.get('nodes', []))} nodes")
            except Exception as e:
                print(f"  ❌ Error: {e}")

    print("🚀 Bulk Graph Extraction Complete.")


if __name__ == "__main__":
    from sqlalchemy import select

    asyncio.run(build_all_graphs())
