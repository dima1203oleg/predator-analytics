import asyncio
import json
import os

from celery import shared_task
import redis.asyncio as aioredis

from app.libs.core.pipeline_fsm import KnowledgePipeline, PipelineState
from app.libs.core.structured_logger import get_logger
from app.tasks.customs_parser import CustomsExcelParser
from app.core.db import async_session_maker
from app.repositories.entity_repository import EntityRepository
from app.repositories.fused_record_repository import FusedRecordRepository
from app.engines.cers import process_entity as process_cers
from app.engines.behavioral import process_entity as process_behavioral
from app.engines.institutional import process_entity as process_institutional
from app.engines.influence import process_entity as process_influence
from app.engines.structural_gaps import process_entity as process_structural
from app.engines.predictive import process_entity as process_predictive


logger = get_logger("predator.workers.pipeline")


@shared_task(
    name="tasks.workers.process_pipeline_task", queue="ingestion", bind=True, max_retries=3
)
def process_pipeline_task(self, source_id: str, file_location: str):
    """Executes the strict Knowledge Pipeline FSM:
    UPLOADED -> PARSING -> TRANSFORMING -> STORING -> INDEXING -> READY.
    """

    async def run_pipeline():
        redis_client = aioredis.from_url(
            os.getenv("REDIS_URL", "redis://redis:6379/0"), decode_responses=True
        )
        pipeline = KnowledgePipeline(redis_client)

        try:
            logger.info(f"Starting pipeline for {source_id}")

            # 1. PARSING
            await pipeline.transition(source_id, PipelineState.PARSING, progress=10)

            stats = None
            if file_location.lower().endswith(".xlsx"):
                logger.info(f"Detected Excel file, running Customs Parser: {file_location}")
                parser = CustomsExcelParser(file_location)
                stats = parser.load_and_parse()

                # Update metadata in Redis with parsing results
                key = pipeline._get_key(source_id)
                current_data = await redis_client.hgetall(key)
                meta = json.loads(current_data.get("metadata", "{}"))
                meta["parser_stats"] = stats
                await redis_client.hset(key, "metadata", json.dumps(meta))

                if (
                    stats.get("rejected", 0) > stats.get("total_rows", 1) * 0.5
                ):  # 50% fail threshold
                    raise ValueError(
                        f"Parser rejected too many rows: {stats['rejected']} / {stats['total_rows']}"
                    )
            else:
                await asyncio.sleep(2)  # Simulating Parsing for other types

            # 2. TRANSFORMING & STORING
            await pipeline.transition(source_id, PipelineState.TRANSFORMING, progress=40)
            
            unique_ueids = set()
            
            if stats and "parser_stats" in meta:
                # results are stored in parser object
                records = parser.results
                
                async with async_session_maker() as session:
                    entity_repo = EntityRepository(session)
                    fused_repo = FusedRecordRepository(session)
                    
                    total_records = len(records)
                    for i, record in enumerate(records):
                        # Extract identification data
                        name = record.get("importer_name", "Unknown Entity")
                        edrpou = record.get("importer_code")
                        
                        # Normalize EDRPOU (remove non-digits, ensure string)
                        if edrpou:
                            edrpou = "".join(filter(str.isdigit, str(edrpou)))
                        
                        # 1. Resolve or Create Entity
                        entity, is_new = await entity_repo.resolve_or_create(
                            name=name,
                            entity_type="company",
                            edrpou=edrpou
                        )
                        
                        ueid_str = str(entity.ueid)
                        unique_ueids.add(ueid_str)
                        
                        # 2. Save Fused Record
                        import hashlib
                        import json
                        raw_json = json.dumps(record, sort_keys=True)
                        fingerprint = hashlib.sha256(raw_json.encode("utf-8")).hexdigest()
                        
                        await fused_repo.save_record(
                            ueid=entity.ueid,
                            source=f"customs_import_{source_id}",
                            raw_data=record,
                            normalized_data=record,
                            fingerprint=fingerprint,
                            quality_score=0.9 # Customs data is high quality
                        )
                        
                        # Update progress occasionally
                        if i % 100 == 0:
                            prog = 40 + int((i / total_records) * 30)
                            await pipeline.transition(source_id, PipelineState.TRANSFORMING, progress=prog)

                    await session.commit()
                    logger.info(f"Stored {total_records} records for {len(unique_ueids)} entities")

            # 3. ENTITY_RESOLUTION (Already done during storage in v55 pattern)
            await pipeline.transition(source_id, PipelineState.ENTITY_RESOLUTION, progress=75)
            await asyncio.sleep(1)

            # 4. INDEXING & SCORING
            await pipeline.transition(source_id, PipelineState.INDEXING, progress=85)
            
            # TRIGGER ANALYTICAL ENGINES
            async with async_session_maker() as session:
                for ueid in unique_ueids:
                    try:
                        logger.info(f"Triggering analysis for UEID: {ueid}")
                        logger.info(f"Triggering analysis for UEID: {ueid}")
                        # 1. Intermediary Layers
                        await process_behavioral(ueid, session)
                        await process_institutional(ueid, session)
                        await process_influence(ueid, session)
                        await process_structural(ueid, session)
                        await process_predictive(ueid, session)
                        # 2. Meta-Scoring (CERS)
                        await process_cers(ueid, session)
                    except Exception as engine_err:
                        logger.error(f"Engine failed for {ueid}: {engine_err}")
                
                await session.commit()

            # 5. READY
            await pipeline.transition(source_id, PipelineState.READY, progress=100)
            logger.info(f"Pipeline completed for {source_id}. Processed {len(unique_ueids)} unique entities.")

        except Exception as e:
            logger.exception(f"Pipeline failed for {source_id}: {e}")
            await pipeline.fail(source_id, str(e))
            # Don't re-raise if we want to avoid infinite loop of retries in this demo
            # In prod, we might retry certain errors
        finally:
            await redis_client.close()
            # Cleanup file
            if os.path.exists(file_location):
                os.remove(file_location)

    return asyncio.run(run_pipeline())
