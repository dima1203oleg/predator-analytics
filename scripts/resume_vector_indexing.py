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
logger = logging.getLogger("vector_indexing")

# Configuration
raw_db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@postgres:5432/predator_db")
DB_URL = raw_db_url.replace("postgresql+asyncpg://", "postgresql://")
OLLAMA_URL = os.getenv("LLM_OLLAMA_BASE_URL", "http://ollama:11434/api")
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
COLLECTION_NAME = "documents_safe"
BATCH_SIZE = 50  # Reduced batch size for stability
PARALLEL_EMBEDS = 4 # Reduced parallelism for stability

class VectorIndexer:
    def __init__(self):
        self.session = None

    async def get_session(self):
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=120))
        return self.session

    async def close(self):
        if self.session:
            await self.session.close()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError))
    )
    async def _embed_single(self, session, text: str) -> list[float]:
        """Worker for single embedding request."""
        clean_text = text[:3000] if text else ""
        payload = {"model": EMBEDDING_MODEL, "prompt": clean_text}

        # logger.info(f"Embedding request length: {len(clean_text)}")
        async with session.post(f"{OLLAMA_URL}/embeddings", json=payload) as resp:
            if resp.status != 200:
                body = await resp.text()
                logger.warning(f"Ollama embedding failed: {resp.status} - {body}")
                return [0.0]*768
            data = await resp.json()
            return data.get("embedding", [0.0]*768)

    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings using Ollama with high parallelism."""
        if not texts:
            return []

        session = await self.get_session()
        sem = asyncio.Semaphore(PARALLEL_EMBEDS)

        async def sem_wrap(text):
            async with sem:
                return await self._embed_single(session, text)

        tasks = [sem_wrap(t) for t in texts]
        return await asyncio.gather(*tasks)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError))
    )
    async def upload_to_qdrant(self, points: list[dict[str, Any]]):
        """Upload points to Qdrant."""
        if not points:
            return

        session = await self.get_session()
        payload = {"points": points}

        async with session.put(
            f"{QDRANT_URL}/collections/{COLLECTION_NAME}/points?wait=true",
            json=payload
        ) as resp:
            if resp.status not in (200, 201):
                text = await resp.text()
                raise aiohttp.ClientError(f"Qdrant Error {resp.status}: {text[:200]}")

    async def ensure_collection_exists(self):
        session = await self.get_session()
        async with session.get(f"{QDRANT_URL}/collections/{COLLECTION_NAME}") as resp:
            if resp.status == 200:
                logger.info(f"Collection {COLLECTION_NAME} exists.")
                return

        config = {
            "vectors": {
                "size": 768,
                "distance": "Cosine"
            }
        }
        async with session.put(f"{QDRANT_URL}/collections/{COLLECTION_NAME}", json=config) as resp:
             if resp.status not in (200, 201):
                 text = await resp.text()
                 logger.error(f"Failed to create Qdrant collection: {text}")
                 raise Exception(f"Failed to create collection: {text}")
        logger.info(f"Created collection {COLLECTION_NAME}")

async def run_vector_logic():
    indexer = VectorIndexer()

    try:
        logger.info("Initializing Vector Logic...")
        logger.info(f"Settings: Batch={BATCH_SIZE}, Parallel={PARALLEL_EMBEDS}, Model={EMBEDDING_MODEL}")

        # 1. Setup Qdrant
        await indexer.ensure_collection_exists()

        # 2. Connect to Postgres
        logger.info(f"Connecting to DB: {DB_URL}")
        conn = await asyncpg.connect(DB_URL)
        logger.info("DB Connected successfully.")

        # 3. Iterate and Vectorize (KEYSET PAGINATION)
        try:
            logger.info("Checking total rows...")
            count_query = "SELECT count(*) FROM staging_customs"
            total_rows = await conn.fetchval(count_query)
            logger.info(f"Total rows to process: {total_rows}")

            # --- ETL Tracking ---
            etl_job_id = None
            source_file_name = "manual_fix_march_2024.xlsx"
            existing_job = await conn.fetchrow(
                "SELECT id FROM raw.etl_jobs WHERE source_file = $1 ORDER BY created_at DESC LIMIT 1",
                source_file_name
            )

            if existing_job:
                etl_job_id = existing_job['id']
                logger.info(f"Resuming ETL Job tracking for ID: {etl_job_id}")
                await conn.execute("UPDATE raw.etl_jobs SET state = 'INDEXING', updated_at = NOW() WHERE id = $1", etl_job_id)
            else:
                etl_job_id = uuid.uuid4()
                logger.info(f"Creating new ETL Job tracking ID: {etl_job_id}")
                await conn.execute(
                    """
                    INSERT INTO raw.etl_jobs (id, source_file, state, progress, tenant_id, dataset_type, created_at, updated_at)
                    VALUES ($1, $2, 'INDEXING', $3, $4, 'customs', NOW(), NOW())
                    """,
                    etl_job_id, source_file_name,
                    json.dumps({"percent": 0, "records_total": total_rows}), uuid.uuid4()
                )

            # --- Keyset Loop ---
            last_id = 0
            processed = 0
            start_time = time.time()
            max_id_query = "SELECT MAX(id) FROM staging_customs"
            max_id = await conn.fetchval(max_id_query) or 0
            logger.info(f"Max ID in table: {max_id}")

            while True:
                # Fetch batch
                # logger.info(f"Fetching batch after ID {last_id}...")
                rows = await conn.fetch(
                    'SELECT id, "опис_товару", "відправник", "одержувач" FROM staging_customs WHERE id > $1 ORDER BY id ASC LIMIT $2',
                    last_id, BATCH_SIZE
                )

                if not rows:
                    logger.info("No more rows to fetch. Exiting loop.")
                    break

                batch_points = []
                texts_to_embed = []
                ids = []

                for row in rows:
                    prod_desc = row['опис_товару'] or ""
                    sender = row['відправник'] or ""
                    recipient = row['одержувач'] or ""
                    text_repr = f"Product: {prod_desc}. Sender: {sender}. Recipient: {recipient}."

                    texts_to_embed.append(text_repr)
                    ids.append(row['id'])

                # Update last_id for next iteration
                last_id = ids[-1]

                # Generate Embeddings
                t0 = time.time()
                # logger.info(f"Generating {len(texts_to_embed)} embeddings...")
                embeddings = await indexer.generate_embeddings(texts_to_embed)
                embed_time = time.time() - t0

                # Prepare Qdrant Points
                for i, embedding in enumerate(embeddings):
                   if not any(embedding): continue
                   payload = {
                       "description": texts_to_embed[i][:500],
                       "db_id": ids[i]
                   }
                   batch_points.append({
                       "id": ids[i],
                       "vector": embedding,
                       "payload": payload
                   })

                # Upload
                if batch_points:
                    # logger.info(f"Uploading {len(batch_points)} points to Qdrant...")
                    await indexer.upload_to_qdrant(batch_points)

                processed += len(rows)

                # Logging & Progress Update
                elapsed = time.time() - start_time
                rate = processed / elapsed if elapsed > 0 else 0
                percent = int((last_id / max_id) * 100) if max_id > 0 else 0

                if processed % (BATCH_SIZE * 5) == 0:
                    logger.info(f"Progress: {processed} items (ID: {last_id}/{max_id}, {percent}%) | Rate: {rate:.1f} doc/s")

                    try:
                        progress_data = {
                            "percent": percent,
                            "records_total": total_rows,
                            "records_processed": processed,
                            "records_indexed": processed,
                            "last_id": last_id
                        }
                        await conn.execute(
                            "UPDATE raw.etl_jobs SET progress = $1, updated_at = NOW() WHERE id = $2",
                            json.dumps(progress_data), etl_job_id
                        )
                    except Exception as e:
                        logger.warning(f"Failed to update job status: {e}")

            logger.info(f"✅ Vector Indexing Complete! Processed {processed} vectors.")

            # Finalize
            if etl_job_id:
                final_data = {"percent": 100, "records_total": total_rows, "records_processed": processed}
                await conn.execute(
                    "UPDATE raw.etl_jobs SET state = 'completed', progress = $1, updated_at = NOW() WHERE id = $2",
                    json.dumps(final_data), etl_job_id
                )

        finally:
            await conn.close()

    except Exception as e:
        logger.exception(f"❌ Vector Indexing CRASHED: {e}")
    finally:
        await indexer.close()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_vector_logic())
