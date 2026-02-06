import asyncio
import json
import os

from celery import shared_task
import redis.asyncio as aioredis

from app.libs.core.pipeline_fsm import KnowledgePipeline, PipelineState
from app.libs.core.structured_logger import get_logger
from app.tasks.customs_parser import CustomsExcelParser


logger = get_logger("predator.workers.pipeline")

@shared_task(
    name="tasks.workers.process_pipeline_task",
    queue="ingestion",
    bind=True,
    max_retries=3
)
def process_pipeline_task(self, source_id: str, file_location: str):
    """Executes the strict Knowledge Pipeline FSM:
    UPLOADED -> PARSING -> TRANSFORMING -> STORING -> INDEXING -> READY
    """
    async def run_pipeline():
        redis_client = aioredis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"), decode_responses=True)
        pipeline = KnowledgePipeline(redis_client)

        try:
            logger.info(f"Starting pipeline for {source_id}")

            # 1. PARSING
            await pipeline.transition(source_id, PipelineState.PARSING, progress=10)

            stats = None
            if file_location.lower().endswith('.xlsx'):
                logger.info(f"Detected Excel file, running Customs Parser: {file_location}")
                parser = CustomsExcelParser(file_location)
                stats = parser.load_and_parse()

                # Update metadata in Redis with parsing results
                key = pipeline._get_key(source_id)
                current_data = await redis_client.hgetall(key)
                meta = json.loads(current_data.get('metadata', '{}'))
                meta['parser_stats'] = stats
                await redis_client.hset(key, 'metadata', json.dumps(meta))

                if stats.get('rejected', 0) > stats.get('total_rows', 1) * 0.5: # 50% fail threshold
                    raise ValueError(f"Parser rejected too many rows: {stats['rejected']} / {stats['total_rows']}")
            else:
                await asyncio.sleep(2) # Simulating Parsing for other types

            # 2. TRANSFORMING
            await pipeline.transition(source_id, PipelineState.TRANSFORMING, progress=40)
            await asyncio.sleep(2)

            # 3. STORING (Entity Resolution & Graph)
            await pipeline.transition(source_id, PipelineState.ENTITY_RESOLUTION, progress=60)

            # --- ENTITY RESOLUTION LOGIC (Per Contract) ---
            # 1. Fetch potential duplicates from Qdrant/OpenSearch
            # 2. Compare using Levenshtein/Cosine Similarity
            # 3. If similarity > 0.85 (CONFIDENCE_THRESHOLD):
            #    - Merge entities (upsert)
            #    - Log 'why_returned': "High confidence match (0.XX)"
            # 4. Else:
            #    - Create new entity
            # ----------------------------------------------

            await asyncio.sleep(2) # Placeholder for actual logic

            await pipeline.transition(source_id, PipelineState.STORING, progress=70)
            await asyncio.sleep(1)

            # 4. INDEXING
            await pipeline.transition(source_id, PipelineState.INDEXING, progress=85)
            # Here we would call index_gold_documents
            await asyncio.sleep(2)

            # 5. READY
            await pipeline.transition(source_id, PipelineState.READY, progress=100)
            logger.info(f"Pipeline completed for {source_id}")

        except Exception as e:
            logger.error(f"Pipeline failed for {source_id}: {e}")
            await pipeline.fail(source_id, str(e))
            # Don't re-raise if we want to avoid infinite loop of retries in this demo
            # In prod, we might retry certain errors
        finally:
            await redis_client.close()
            # Cleanup file
            if os.path.exists(file_location):
                os.remove(file_location)

    return asyncio.run(run_pipeline())
