from __future__ import annotations

import asyncio
import logging
import os
import sys

import asyncpg
from opensearchpy import AsyncOpenSearch, helpers


# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("SmartIndexer")

# Config
DB_URL = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
OPENSEARCH_URL = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
INDEX_NAME = "customs_march_2024"
BATCH_SIZE = 200
DELAY_BETWEEN_BATCHES = 0.5  # Seconds

async def get_total_count(conn):
    return await conn.fetchval("SELECT count(*) FROM staging_march_2024")

async def fetch_batch(conn, offset, limit):
    query = """
        SELECT
            id,
            description,
            hs_code,
            trading_country,
            recipient_name,
            decl_number
        FROM staging_march_2024
        ORDER BY id
        OFFSET $1 LIMIT $2
    """
    return await conn.fetch(query, offset, limit)

async def check_index_exists(os_client, index_name):
    exists = await os_client.indices.exists(index=index_name)
    if not exists:
        logger.info(f"Creating index: {index_name}")
        body = {
            "settings": {
                "index": {
                    "number_of_shards": 1,
                    "number_of_replicas": 0
                }
            },
            "mappings": {
                "properties": {
                    "description": {"type": "text", "analyzer": "standard"},
                    "hs_code": {"type": "keyword"},
                    "trading_country": {"type": "keyword"},
                    "recipient_name": {"type": "text"},
                    "decl_number": {"type": "keyword"}
                }
            }
        }
        await os_client.indices.create(index=index_name, body=body)

async def main():
    logger.info("🚀 Starting Smart Indexer for March 2024 Registry...")

    # Connections
    try:
        conn = await asyncpg.connect(DB_URL)
        os_client = AsyncOpenSearch(hosts=[{'host': 'localhost', 'port': 9200}], http_auth=('admin', 'admin'), use_ssl=False)

        # Check Source
        total_records = await get_total_count(conn)
        logger.info(f"📊 Found {total_records} records in PostgreSQL.")

        if total_records == 0:
            logger.warning("No records to index!")
            return

        # Prepare Target
        await check_index_exists(os_client, INDEX_NAME)

        # Processing Loop
        processed = 0
        failed_batches = 0

        while processed < total_records:
            try:
                rows = await fetch_batch(conn, processed, BATCH_SIZE)
                if not rows:
                    break

                actions = []
                for row in rows:
                    doc = dict(row)
                    doc['source'] = 'customs_registry'
                    doc['month'] = '03-2024'

                    action = {
                        "_index": INDEX_NAME,
                        "_id": str(doc['id']),
                        "_source": doc
                    }
                    actions.append(action)

                # Bulk Insert
                await helpers.async_bulk(os_client, actions)

                processed += len(rows)
                sys.stdout.write(f"\r✅ Indexed: {processed}/{total_records} ({(processed/total_records)*100:.1f}%)")
                sys.stdout.flush()

                # Backpressure relief
                await asyncio.sleep(DELAY_BETWEEN_BATCHES)

            except Exception as e:
                logger.exception(f"\n❌ Batch failed at offset {processed}: {e}")
                failed_batches += 1
                await asyncio.sleep(5) # Cooldown
                if failed_batches > 10:
                    logger.critical("Too many failures. Aborting.")
                    break

        logger.info("\n🎉 Indexing Complete.")

    except Exception as e:
        logger.critical(f"Critical System Error: {e}")
    finally:
        if 'conn' in locals(): await conn.close()
        if 'os_client' in locals(): await os_client.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nStopping...")
