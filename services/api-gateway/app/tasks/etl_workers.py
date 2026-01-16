"""
UA Sources - Background Workers for TS-Compliant ETL Pipeline
Implements separate Parser, Processor, and Indexer agents as per Technical Specification
"""
from celery import shared_task
import asyncio
import json
import asyncpg
import sys
import os
from libs.core.config import settings

# Add root to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../../'))

from libs.core.structured_logger import get_logger, RequestLogger
logger = get_logger("predator.workers.etl")

# Data Contracts
from libs.core.contracts.payloads import IndexingTaskPayload, ETLTaskPayload, validate_payload, DatasetType

# Service Imports
from app.services.etl_ingestion import ETLIngestionService


# ============================================================================
# 1. DATA INGEST PARSER - Collects raw data from external sources
# ============================================================================

@shared_task(name="tasks.workers.parse_external_source", queue="ingestion")
def parse_external_source(source_type: str, config: dict = None):
    """
    Parser Agent: Fetch data from external sources and save to staging.raw_data

    Args:
        source_type: Type of source (prozorro, nbu, customs, etc.)
        config: Source-specific configuration

    Returns:
        {status, records_fetched, staging_ids}
    """
    with RequestLogger(logger, "parser_ingestion", source_type=source_type) as req_logger:
        req_logger.info("ingestion_started", config=config)

        async def run_parser():
            db_url = settings.CLEAN_DATABASE_URL
            conn = await asyncpg.connect(db_url)

            try:
                records_fetched = 0
                staging_ids = []

                # Select connector based on source type
                if source_type == "prozorro":
                    from app.connectors.prozorro import prozorro_connector
                    result = await prozorro_connector.search(
                        query=config.get("query") if config else None,
                        limit=config.get("limit", 50) if config else 50
                    )
                    if result.success and result.data:
                        for tender in result.data:
                            # Save to staging.raw_data
                            staging_id = await conn.fetchval("""
                                INSERT INTO staging.raw_data (source, raw_content, dataset_type, fetched_at)
                                VALUES ($1, $2, $3, NOW())
                                RETURNING id
                            """, "prozorro", json.dumps(tender), "tenders")
                            staging_ids.append(staging_id)
                            records_fetched += 1

                elif source_type == "nbu":
                    from app.connectors.nbu_fx import nbu_fx_connector
                    result = await nbu_fx_connector.get_all_rates()
                    if result.success and result.data:
                        for rate in result.data:
                            staging_id = await conn.fetchval("""
                                INSERT INTO staging.raw_data (source, raw_content, dataset_type, fetched_at)
                                VALUES ($1, $2, $3, NOW())
                                RETURNING id
                            """, "nbu", json.dumps(rate), "exchange_rates")
                            staging_ids.append(staging_id)
                            records_fetched += 1

                elif source_type == "customs":
                    from app.connectors.customs import CustomsConnector
                    connector = CustomsConnector()
                    result = await connector.fetch(config or {})
                    if result.success and result.data:
                        for record in result.data:
                            staging_id = await conn.fetchval("""
                                INSERT INTO staging.raw_data (source, raw_content, dataset_type, fetched_at)
                                VALUES ($1, $2, $3, NOW())
                                RETURNING id
                            """, "customs", json.dumps(record), "customs")
                            staging_ids.append(staging_id)
                            records_fetched += 1

                req_logger.info(
                    "ingestion_completed",
                    records_fetched=records_fetched,
                    source_type=source_type
                )

                # Trigger processor for new records (Batched)
                if staging_ids:
                    batch_size = 100
                    for i in range(0, len(staging_ids), batch_size):
                        batch = staging_ids[i:i + batch_size]
                        process_staging_records.delay(batch)
                        logger.info(f"Queued processing batch {i // batch_size + 1}: {len(batch)} records")

                return {
                    "status": "success",
                    "source": source_type,
                    "records_fetched": records_fetched,
                    "staging_ids": staging_ids
                }

            except Exception as e:
                req_logger.exception("ingestion_failed", error=str(e))
                return {"status": "failed", "error": str(e)}
            finally:
                await conn.close()

        return asyncio.run(run_parser())


@shared_task(name="tasks.workers.process_file_task", queue="etl")
def process_file_task(**kwargs):
    """
    ETL File Processor: Processes uploaded files (Excel/CSV) into database
    Uses ETLTaskPayload for strict contract validation.
    """
    # Validate payload
    payload = validate_payload(ETLTaskPayload, kwargs)

    with RequestLogger(
        logger,
        "etl_file_processing",
        source_id=payload.source_id,
        filename=os.path.basename(payload.file_path)
    ) as req_logger:

        req_logger.info(
            "etl_task_started",
            dataset_type=payload.dataset_type.value,
            options=payload.options
        )

        async def run_file_processor():
            service = ETLIngestionService()
            try:
                # Delegate to actual service
                result = await service.process_file(
                    file_path=payload.file_path,
                    dataset_type=payload.dataset_type.value
                )

                req_logger.info(
                    "etl_task_completed",
                    records_processed=result.get("records_processed", 0),
                    status=result.get("status")
                )
                return result

            except Exception as e:
                req_logger.exception("etl_task_failed", error=str(e))
                raise

        return asyncio.run(run_file_processor())


# ============================================================================
# 2. DATA PROCESSOR - Transforms staging to gold
# ============================================================================

@shared_task(name="tasks.workers.process_staging_data", queue="etl")
def process_staging_data(staging_ids: list):
    """
    Processor Agent: Transform raw data from staging and move to gold schema.
    Includes Semantic Deduplication via UnifiedMemoryManager.
    """
    with RequestLogger(logger, "staging_processing", records_count=len(staging_ids)) as req_logger:
        async def run_processor():
            # Lazy import to avoid circular dependencies
            from libs.core.memory.unified_memory import memory_manager

            db_url = settings.CLEAN_DATABASE_URL
            conn = await asyncpg.connect(db_url)

            try:
                processed_count = 0
                skipped_count = 0
                gold_ids = []

                for staging_id in staging_ids:
                    # Fetch raw record
                    row = await conn.fetchrow("""
                        SELECT id, source, raw_content, dataset_type
                        FROM staging.raw_data
                        WHERE id = $1 AND processed = FALSE
                    """, staging_id)

                    if not row:
                        continue

                    raw_content = row["raw_content"]
                    dataset_type = row["dataset_type"]

                    # Transform based on dataset type
                    if dataset_type == "tenders":
                        title = raw_content.get("title", "Untitled Tender")
                        content = raw_content.get("description", "")
                        author = raw_content.get("procuring_entity", {}).get("name", "Unknown")
                        published_date = raw_content.get("date", None)
                        category = "tenders"

                    elif dataset_type == "exchange_rates":
                        title = f"NBU Rate: {raw_content.get('cc', 'Unknown')}"
                        content = f"Rate: {raw_content.get('rate', 0)} as of {raw_content.get('exchangedate', '')}"
                        author = "NBU"
                        published_date = None
                        category = "finance"

                    elif dataset_type == "customs":
                        title = raw_content.get("title", f"Customs Record {staging_id}")
                        content = raw_content.get("content", json.dumps(raw_content))
                        author = raw_content.get("declarant", "Unknown")
                        published_date = raw_content.get("date")
                        category = "customs"

                    else:
                        # Generic document
                        title = raw_content.get("title", f"Document {staging_id}")
                        content = raw_content.get("content", json.dumps(raw_content))
                        author = raw_content.get("author")
                        published_date = raw_content.get("date")
                        category = raw_content.get("category", "general")

                    # SEMANTIC DEDUPLICATION (Smart ETL)
                    # Check if similar content exists in memory
                    is_duplicate = False
                    try:
                        similar_docs = await memory_manager.recall(content, limit=1)
                        if similar_docs and similar_docs[0]['score'] > 0.95:
                            logger.info(f"♻️ Deduplication: Found similar doc with score {similar_docs[0]['score']}")
                            is_duplicate = True
                    except Exception as e:
                        logger.warning(f"Deduplication check failed: {e}")

                    if is_duplicate:
                        # Mark as processed but don't insert to gold
                        await conn.execute("UPDATE staging.raw_data SET processed = TRUE WHERE id = $1", staging_id)
                        skipped_count += 1
                        continue

                    # Insert into gold.documents
                    gold_id = await conn.fetchval("""
                        INSERT INTO gold.documents
                            (title, content, author, published_date, category, source, raw_id)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING id
                    """, title, content, author, published_date, category, row["source"], staging_id)

                    # Mark staging record as processed
                    await conn.execute("""
                        UPDATE staging.raw_data SET processed = TRUE WHERE id = $1
                    """, staging_id)

                    gold_ids.append(str(gold_id))
                    processed_count += 1

                req_logger.info("staging_processing_completed", processed=processed_count, skipped=skipped_count)

                # Trigger indexer for new gold records
                if gold_ids:
                    index_gold_documents.delay(gold_ids)

                return {
                    "status": "success",
                    "processed_count": processed_count,
                    "skipped_duplicates": skipped_count,
                    "gold_ids": gold_ids
                }

            except Exception as e:
                req_logger.error("staging_processing_failed", error=str(e))
                return {"status": "failed", "error": str(e)}
            finally:
                await conn.close()

        return asyncio.run(run_processor())


# ============================================================================
# 3. INDEXING AGENT - Updates OpenSearch + Qdrant
# ============================================================================

@shared_task(name="tasks.workers.index_gold_documents", queue="etl")
def index_gold_documents(gold_ids: list):
    """
    Indexer Agent: Index gold.documents to Unified Memory Layers.
    Replaces legacy OpenSearch/Qdrant separate services.
    """
    with RequestLogger(logger, "gold_indexing", records_count=len(gold_ids)) as req_logger:
        async def run_indexer():
            from libs.core.memory.unified_memory import memory_manager

            conn = None
            try:
                db_url = settings.CLEAN_DATABASE_URL
                conn = await asyncpg.connect(db_url)

                indexed_count = 0

                for gold_id in gold_ids:
                    # Fetch gold record
                    row = await conn.fetchrow("""
                        SELECT id, title, content, category, source, published_date
                        FROM gold.documents
                        WHERE id = $1
                    """, gold_id)

                    if not row:
                        continue

                    # Prepare content for memory
                    # Combining title and content for rich context
                    memory_content = f"Title: {row['title']}\nContent: {row['content']}"

                    # Tags for filtering
                    tags = [
                        f"source:{row['source'] or 'unknown'}",
                        f"category:{row['category'] or 'general'}",
                        f"doc_id:{row['id']}"
                    ]
                    if row['published_date']:
                        tags.append(f"year:{row['published_date'].year}")

                    # Store in Unified Memory (handles Redis, Qdrant, OpenSearch automagically)
                    memory_id = await memory_manager.store(
                        content=memory_content,
                        role="document",
                        tags=tags
                    )

                    if memory_id:
                        indexed_count += 1

                req_logger.info("gold_indexing_completed", indexed_count=indexed_count)

                return {
                    "status": "success",
                    "indexed_count": indexed_count
                }

            except Exception as e:
                req_logger.error("gold_indexing_failed", error=str(e))
                return {"status": "failed", "error": str(e)}
            finally:
                if conn:
                    await conn.close()

        return asyncio.run(run_indexer())


# ============================================================================
# SCHEDULED TASKS (Beat Schedule)
# ============================================================================

@shared_task(name="tasks.workers.scheduled_prozorro_sync")
def scheduled_prozorro_sync():
    """Hourly Prozorro sync (called by Celery Beat)"""
    return parse_external_source.delay("prozorro", {"limit": 100})


@shared_task(name="tasks.workers.scheduled_nbu_sync")
def scheduled_nbu_sync():
    """Daily NBU rates sync (called by Celery Beat)"""
    return parse_external_source.delay("nbu", {})


@shared_task(name="tasks.workers.full_reindex")
def full_reindex():
    """Full reindex of all gold.documents"""
    logger.info("full_reindex_started")

    async def get_all_gold_ids():
        db_url = settings.CLEAN_DATABASE_URL
        conn = await asyncpg.connect(db_url)
        try:
            rows = await conn.fetch("SELECT id FROM gold.documents")
            return [str(row["id"]) for row in rows]
        finally:
            await conn.close()

    gold_ids = asyncio.run(get_all_gold_ids())

    if gold_ids:
        # Process in batches of 100
        batch_size = 100
        for i in range(0, len(gold_ids), batch_size):
            batch = gold_ids[i:i+batch_size]
            index_gold_documents.delay(batch)

    return {"status": "started", "total_documents": len(gold_ids)}
