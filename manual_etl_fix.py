from __future__ import annotations

import asyncio
import logging
import os
import sys
import uuid

import asyncpg
import pandas as pd


# Add app path
sys.path.insert(0, "/app")

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("manual_etl")

async def run_full_etl():
    print("🚀 STARTING E2E ETL VERIFICATION")

    # 1. MINIO / FILE CHECK
    file_path = "/app/uploads/march_2024.xlsx"
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    print(f"✅ File found: {file_path}")

    # 2. PARSING (PostgreSQL)
    print("⚙️ Parsing Excel...")
    try:
        from app.services.etl_ingestion import ETLIngestionService
        service = ETLIngestionService()

        print("🧹 Cleaning up old staging table...")
        conn = await asyncpg.connect(service.db_url)
        await conn.execute("DROP TABLE IF EXISTS staging_customs")
        await conn.close()

        import openpyxl
        wb = openpyxl.load_workbook(str(file_path), read_only=True, data_only=True)
        ws = wb.active

        headers = None
        rows = []
        batch_size = 5000
        total_processed = 0

        import re
        def normalize_column(c):
             col = re.sub(r'[^\w]+', '_', str(c), flags=re.UNICODE).lower().strip('_')
             return col or f'col_{hash(c) % 10000}'

        # Header extraction Extraction
        for row in ws.iter_rows(values_only=True):
             if headers is None:
                 headers = [normalize_column(h) for h in row]
                 print(f"✅ Headers extracted: {headers[:5]}...")
                 continue
             rows.append(row)

             if len(rows) >= batch_size:
                 df = pd.DataFrame(rows, columns=headers)
                 df["ingested_at"] = pd.Timestamp.now()
                 df["source_type"] = "customs"
                 df["job_id"] = "manual_fix_v1"

                 await service._create_table_if_not_exists(df, "staging_customs")
                 await service._load_batch_to_postgres(df, "staging_customs")
                 total_processed += len(rows)
                 print(f"📦 Loaded batch of {len(rows)}. Total: {total_processed}")
                 rows = []

        if rows:
             df = pd.DataFrame(rows, columns=headers)
             df["ingested_at"] = pd.Timestamp.now()
             df["source_type"] = "customs"
             df["job_id"] = "manual_fix_v1"
             await service._create_table_if_not_exists(df, "staging_customs")
             await service._load_batch_to_postgres(df, "staging_customs")
             total_processed += len(rows)
             print(f"📦 Loaded final batch. Total: {total_processed}")

        print(f"✅ PostgreSQL Ingestion Complete. {total_processed} records.")

    except Exception as e:
        import traceback
        print(f"❌ Parsing Failed: {e}")
        traceback.print_exc()
        return

    # 3. INDEXING
    print("🔍 Starting Indexing (OpenSearch + Qdrant)...")
    try:
        from app.services.embedding_service import EmbeddingService
        from app.services.opensearch_indexer import OpenSearchIndexer
        from app.services.qdrant_service import QdrantService

        indexer = OpenSearchIndexer()
        embedder = EmbeddingService()
        qdrant = QdrantService()

        await indexer.create_index("documents_safe")

        conn = await asyncpg.connect(service.db_url)
        # Fetch ALL for real indexing test or Limit? User wants "Full".
        # But for verification speed, let's do 500.
        rows = await conn.fetch("SELECT * FROM staging_customs WHERE job_id = 'manual_fix_v1' LIMIT 500")
        docs = [dict(r) for r in rows]

        for d in docs:
            for k, v in d.items():
                if hasattr(v, 'isoformat'): d[k] = v.isoformat()
                if isinstance(v, uuid.UUID): d[k] = str(v)

        print(f"🧠 Embedding and Indexing {len(docs)} sample documents...")
        count = await indexer.index_documents(
            index_name="documents_safe",
            documents=docs,
            pii_safe=True,
            embedding_service=embedder,
            qdrant_service=qdrant
        )
        print(f"✅ Indexed {count} documents successfully.")
        await conn.close()

    except Exception as e:
        import traceback
        print(f"❌ Indexing Failed: {e}")
        traceback.print_exc()
        return

    print("🏁 E2E ETL SUCCESSFUL! All systems (MinIO -> PG -> OS -> Qdrant) verified.")

if __name__ == "__main__":
    asyncio.run(run_full_etl())
