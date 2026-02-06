from __future__ import annotations

import asyncio
from datetime import datetime
import json
import logging
import os
import sys
import time
from typing import Any, Dict, List
import uuid

import aiohttp
import asyncpg
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("resume_indexing")

# Configuration
raw_db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@postgres:5432/predator_db")
DB_URL = raw_db_url.replace("postgresql+asyncpg://", "postgresql://")
OPENSEARCH_URL = os.getenv("OPENSEARCH_URL", "http://opensearch:9200")
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
INDEX_NAME = "documents_safe"
BATCH_SIZE = 500

class RobustIndexer:
    def __init__(self):
        self.session = None

    async def get_session(self):
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30))
        return self.session

    async def close(self):
        if self.session:
            await self.session.close()

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError))
    )
    async def index_batch(self, batch: list[dict[str, Any]]):
        """Index a batch of documents to OpenSearch."""
        if not batch:
            return

        session = await self.get_session()
        bulk_data = []

        for doc in batch:
            # Prepare metadata
            doc_id = doc.get("id") or f"customs_{doc.get('id', uuid.uuid4())}"

            # Clean document for JSON serialization
            clean_doc = {}
            for k, v in doc.items():
                # Handle datetime objects
                if isinstance(v, (datetime,)):
                    clean_doc[k] = v.isoformat()
                # Handle strings that look like datetimes from PG
                elif isinstance(v, str) and len(v) > 19 and v[10] == ' ':
                    # Convert 'YYYY-MM-DD HH:MM:SS...' to 'YYYY-MM-DDTHH:MM:SS...'
                    clean_doc[k] = v[:10] + 'T' + v[11:]
                elif isinstance(v, uuid.UUID):
                    clean_doc[k] = str(v)
                else:
                    clean_doc[k] = v

            action = {"index": {"_index": INDEX_NAME, "_id": str(doc_id)}}
            bulk_data.append(json.dumps(action))
            bulk_data.append(json.dumps(clean_doc))

        # NDJSON payload
        payload = "\n".join(bulk_data) + "\n"

        async with session.post(
            f"{OPENSEARCH_URL}/_bulk",
            data=payload,
            headers={"Content-Type": "application/x-ndjson"}
        ) as resp:
            if resp.status not in (200, 201):
                text = await resp.text()
                raise aiohttp.ClientError(f"OpenSearch Bulk Error {resp.status}: {text[:200]}")

            resp_json = await resp.json()
            if resp_json.get("errors"):
                # Log first error but don't crash whole batch (soft fail)
                # In robust mode we might want to retry failed items, but for now log and move on
                first_error = next((i for i in resp_json["items"] if i["index"].get("error")), None)
                logger.warning(f"Partial errors in bulk index: {first_error}")

    async def create_index_if_not_exists(self):
        session = await self.get_session()
        async with session.head(f"{OPENSEARCH_URL}/{INDEX_NAME}") as resp:
            if resp.status == 200:
                logger.info(f"Index {INDEX_NAME} exists.")
                return

        # Create index with simplified mapping
        mapping = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0
            },
            "mappings": {
                "properties": {
                    "ingested_at": {"type": "date"},
                    "description": {"type": "text"},
                    "hs_code": {"type": "keyword"}
                }
            }
        }
        async with session.put(f"{OPENSEARCH_URL}/{INDEX_NAME}", json=mapping) as resp:
            if resp.status not in (200, 201):
                text = await resp.text()
                logger.error(f"Failed to create index: {text}")

async def run_resume_logic():
    indexer = RobustIndexer()

    try:
        # 1. Wait for OpenSearch
        logger.info("Waiting for OpenSearch...")
        for i in range(30):
            try:
                await indexer.create_index_if_not_exists()
                break
            except Exception:
                await asyncio.sleep(2)
                if i % 5 == 0: logger.info("Still waiting for OpenSearch...")

        # 2. Connect to Postgres
        logger.info(f"Connecting to DB: {DB_URL}")
        conn = await asyncpg.connect(DB_URL)

        # 3. Iterate and Index
        try:
            # We want to resume. A simple way in this fix is to just re-index all.
            # OpenSearch handles updates efficiently (overwrite).
            # To be smarter, we could query max ID in OS, but let's just stream all for consistency.

            logger.info("Starting Server-Side Cursor over staging_customs...")
            count_query = "SELECT count(*) FROM staging_customs"
            total_rows = await conn.fetchval(count_query)
            logger.info(f"Total rows to process: {total_rows}")

            async with conn.transaction():
                # Correct cursor usage
                cursor = await conn.cursor("SELECT * FROM staging_customs")

                processed = 0
                start_time = time.time()

                while True:
                    rows = await cursor.fetch(BATCH_SIZE)
                    if not rows:
                        break

                    batch = [dict(r) for r in rows]
                    await indexer.index_batch(batch)

                    processed += len(batch)
                    if processed % 5000 == 0:
                        elapsed = time.time() - start_time
                        rate = processed / elapsed
                        logger.info(f"Progress: {processed}/{total_rows} ({rate:.1f} doc/s)")

            logger.info(f"✅ Indexing Complete! Processed {processed} documents.")

        finally:
            await conn.close()

    except Exception as e:
        logger.exception(f"❌ Indexing Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await indexer.close()

if __name__ == "__main__":
    asyncio.run(run_resume_logic())
