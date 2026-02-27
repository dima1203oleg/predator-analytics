from __future__ import annotations


"""UA Sources - Background Workers for TS-Compliant ETL Pipeline
Implements separate Parser, Processor, and Indexer agents as per Technical Specification.
"""
import asyncio
from datetime import UTC, datetime, timezone
import json
import os
import sys
from typing import Any, cast
from urllib.parse import urlparse
import uuid

import asyncpg
from celery import shared_task
from croniter import croniter
import redis.asyncio as redis

from app.libs.core.config import settings


# Add root to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../../'))

from app.libs.core.structured_logger import RequestLogger, get_logger


logger = get_logger("predator.workers.etl")

# Data Contracts
from app.libs.core.contracts.payloads import IndexingTaskPayload


async def publish_etl_update(event_type: str, data: dict):
    """Publish ETL update to Redis for WebSocket broadcasting."""
    try:
        r = redis.Redis(
            host=os.getenv("REDIS_HOST", "redis"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            decode_responses=True
        )
        payload = {
            "type": "etl_update",
            "event": event_type,
            "timestamp": datetime.now(UTC).isoformat(),
            **data
        }
        await r.publish("predator:system:updates", json.dumps(payload))
    except Exception as e:
        logger.warning(f"Failed to publish ETL update: {e}")


# ============================================================================
# 1. DATA INGEST PARSER - Collects raw data from external sources
# ============================================================================

@shared_task(
    name="tasks.workers.parse_external_source",
    queue="ingestion",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600
)
def parse_external_source(self, source_type: str, config: dict | None = None):
    """Parser Agent: Fetch data from external sources and save to staging.raw_data.

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
                await publish_etl_update("ingestion_started", {"source": source_type})
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

                elif source_type == "telegram":
                    # Telegram Channel Parsing (v45.1)
                    try:
                        from app.connectors.telegram_channel import telegram_channel_connector
                        channel_username = config.get("channelUsername") if config else None
                        if channel_username:
                            result = await telegram_channel_connector.search(
                                channel_username,
                                limit=config.get("limit", 100) if config else 100,
                                channel_username=channel_username
                            )
                            if result.success and result.data:
                                for message in result.data:
                                    staging_id = await conn.fetchval("""
                                        INSERT INTO staging.raw_data (source, raw_content, dataset_type, fetched_at)
                                        VALUES ($1, $2, $3, NOW())
                                        RETURNING id
                                    """, "telegram", json.dumps(message), "telegram_messages")
                                    staging_ids.append(staging_id)
                                    records_fetched += 1
                            else:
                                req_logger.warning("telegram_fetch_failed", error=result.error)
                        else:
                            req_logger.warning("telegram_channel_not_specified")
                    except ImportError:
                        req_logger.exception("telegram_connector_not_available")

                elif source_type == "web":
                    # Web Scraping (v45.1)
                    try:
                        from app.connectors.web_scraper import web_scraper_connector
                        url = config.get("url") if config else None
                        if url:
                            result = await web_scraper_connector.search(
                                url,
                                limit=config.get("limit", 10) if config else 10,
                                use_playwright=config.get("usePlaywright", False) if config else False,
                                follow_links=config.get("followLinks", False) if config else False,
                                max_depth=config.get("maxDepth", 1) if config else 1
                            )
                            if result.success and result.data:
                                for page in result.data:
                                    staging_id = await conn.fetchval("""
                                        INSERT INTO staging.raw_data (source, raw_content, dataset_type, fetched_at)
                                        VALUES ($1, $2, $3, NOW())
                                        RETURNING id
                                    """, "web_scraper", json.dumps(page), "web_pages")
                                    staging_ids.append(staging_id)
                                    records_fetched += 1
                            else:
                                req_logger.warning("web_scrape_failed", error=result.error)
                        else:
                            req_logger.warning("web_url_not_specified")
                    except ImportError:
                        req_logger.exception("web_scraper_connector_not_available")

                elif source_type == "rss":
                    # RSS/Atom Feed Parsing (v45.1)
                    try:
                        from app.connectors.web_scraper import web_scraper_connector
                        feed_url = config.get("url") if config else None
                        if feed_url:
                            result = await web_scraper_connector.scrape_rss_feed(feed_url)
                            if result.success and result.data:
                                for item in result.data:
                                    staging_id = await conn.fetchval("""
                                        INSERT INTO staging.raw_data (source, raw_content, dataset_type, fetched_at)
                                        VALUES ($1, $2, $3, NOW())
                                        RETURNING id
                                    """, "rss_feed", json.dumps(item), "rss_items")
                                    staging_ids.append(staging_id)
                                    records_fetched += 1
                            else:
                                req_logger.warning("rss_fetch_failed", error=result.error)
                        else:
                            req_logger.warning("rss_url_not_specified")
                    except ImportError:
                        req_logger.exception("web_scraper_connector_not_available")

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
                cast('Any', req_logger).error("ingestion_failed", error=str(e), exc_info=True)
                return {"status": "failed", "error": str(e)}
            finally:
                await conn.close()

        return asyncio.run(run_parser())


# ============================================================================
# 2. DATA PROCESSOR - Transforms staging to gold
# ============================================================================

@shared_task(
    name="tasks.workers.process_staging_records",
    queue="etl",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300
)
def process_staging_records(self, staging_ids: list):
    """Processor Agent: Transform raw data from staging to gold.documents.

    COMPLEX OPTIMIZATION (v45.1):
    - Unified Meta Handling: author, published_date, category -> meta JSONB
    - Schema Compliance: tenant_id, source_type
    - New Data Types: telegram_messages, web_pages, rss_items
    """
    logger.info("staging_processing_started", records_count=len(staging_ids))

    async def run_processor():
        db_url = settings.CLEAN_DATABASE_URL
        conn = await asyncpg.connect(db_url)
        SYSTEM_TENANT_ID = "00000000-0000-0000-0000-000000000000"

        try:
            await publish_etl_update("processing_started", {"records_count": len(staging_ids)})
            processed_count = 0
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
                if isinstance(raw_content, str):
                    try:
                        raw_content = json.loads(raw_content)
                    except json.JSONDecodeError:
                        raw_content = {"content": raw_content}

                # Ensure raw_content is a dict for the following .get calls
                if not isinstance(raw_content, dict):
                    raw_content = {"content": str(raw_content)}

                # Explicitly cast to dict for linter
                rc: dict = raw_content

                dataset_type = row["dataset_type"]
                source_connector = row["source"]

                # --- 1. UNIFIED TRANSFORMATION LOGIC ---
                title = "Untitled Document"
                content = ""
                meta = {
                    "raw_id": staging_id,
                    "dataset_type": dataset_type,
                    "connector": source_connector,
                    "original_source": source_connector
                }

                # Transform based on dataset type
                if dataset_type == "tenders":
                    title = rc.get("title", f"Tender {rc.get('tenderID', '')}")
                    content = rc.get("description", "")
                    meta["author"] = rc.get("procuring_entity", {}).get("name", "Unknown")
                    meta["published_date"] = rc.get("date")
                    meta["category"] = "gov_procurement"
                    meta["amount"] = rc.get("value", {}).get("amount")

                elif dataset_type == "telegram_messages":
                    # Telegram Message
                    channel = rc.get("chat_title", "Unknown Channel")
                    msg_id = rc.get("id", "")
                    title = f"Telegram: {channel} #{msg_id}"
                    content = rc.get("message") or rc.get("text") or ""
                    meta["author"] = channel # Channel name as author
                    meta["published_date"] = rc.get("date")
                    meta["category"] = "social_media"
                    meta["views"] = rc.get("views")
                    meta["link"] = f"https://t.me/{rc.get('chat_username')}/{msg_id}" if rc.get('chat_username') else None

                elif dataset_type == "web_pages":
                    # Web Scraped Page
                    title = rc.get("title", "Web Page")
                    content = rc.get("text_content") or rc.get("content") or ""
                    meta["author"] = urlparse(rc.get("url", "")).netloc
                    meta["published_date"] = rc.get("scraped_at")
                    meta["category"] = "open_web"
                    meta["url"] = rc.get("url")
                    meta["keywords"] = rc.get("meta_keywords")

                elif dataset_type == "rss_items":
                    # RSS News Item
                    title = rc.get("title", "News Item")
                    content = rc.get("description", "")
                    meta["author"] = rc.get("author") or rc.get("source", "RSS")
                    meta["published_date"] = rc.get("pub_date")
                    meta["category"] = "news"
                    meta["link"] = rc.get("link")
                    meta["tags"] = rc.get("categories", [])

                elif dataset_type == "exchange_rates":
                    title = f"NBU Rate: {rc.get('cc', 'Unknown')}"
                    content = f"Rate: {rc.get('rate', 0)} as of {rc.get('exchangedate', '')}"
                    meta["author"] = "NBU"
                    meta["published_date"] = None
                    meta["category"] = "finance"

                elif dataset_type == "customs":
                    title = rc.get("title", f"Customs Record {staging_id}")
                    content = rc.get("content", json.dumps(rc))
                    meta["author"] = rc.get("declarant", "Unknown")
                    meta["published_date"] = rc.get("date")
                    meta["category"] = "customs"

                else:
                    # Generic fallback
                    title = rc.get("title", f"Document {staging_id}")
                    content = rc.get("content", json.dumps(rc))
                    meta["author"] = rc.get("author", "Unknown")
                    meta["published_date"] = rc.get("date")
                    meta["category"] = rc.get("category", "general")

                # --- 1.1 DATA QUALITY & ENRICHMENT ---

                # A. Content Hashing for Deduplication
                import hashlib
                content_hash = hashlib.md5((title + content).encode('utf-8')).hexdigest()
                meta["content_hash"] = content_hash

                # Duplicate Check
                # Use SQL to check if meta->>'content_hash' exists
                exists = await conn.fetchval("""
                    SELECT id FROM gold.documents
                    WHERE meta->>'content_hash' = $1
                    LIMIT 1
                """, content_hash)

                if exists:
                    logger.info(f"Skipping duplicate: {title} (Hash: {content_hash})")
                    # Mark as processed anyway to remove from queue
                    await conn.execute("UPDATE staging.raw_data SET processed = TRUE WHERE id = $1", staging_id)
                    continue

                # B. Simple Auto-Tagging (Keyword Extraction)
                # Ensure we have tags list
                if "tags" not in meta:
                    meta["tags"] = []

                # Basic keyword list (In real generic, use TF-IDF or specific libraries)
                # Here we just look for high-value signal words
                keywords_of_interest = ["війна", "дрон", "корупція", "тендер", "суд", "бпла", "розвідка", "сбу", "набу", "зсу"]
                text_lower = (title + " " + content).lower()
                found_tags = [kw for kw in keywords_of_interest if kw in text_lower]
                if found_tags:
                    # Append unique
                    current_tags = set(meta["tags"]) if isinstance(meta["tags"], list) else set()
                    current_tags.update(found_tags)
                    meta["tags"] = list(current_tags)

                # --- 2. DATABASE INSERTION (CORRECT SCHEMA) ---
                # gold.documents: id, tenant_id, title, content, source_type, meta, created_at

                # Check duplication? (Optional optimization: check content hash)

                gold_id = await conn.fetchval("""
                    INSERT INTO gold.documents
                        (tenant_id, title, content, source_type, meta, created_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                    RETURNING id
                """, SYSTEM_TENANT_ID, title, content, dataset_type, json.dumps(meta))

                # --- 3. MARK PROCESSED ---
                await conn.execute("""
                    UPDATE staging.raw_data SET processed = TRUE WHERE id = $1
                """, staging_id)

                gold_ids.append(str(gold_id))
                processed_count += 1

            await publish_etl_update("processing_completed", {"processed_count": processed_count})
            logger.info("staging_processing_completed", processed_count=processed_count)

            # --- 4. TRIGGER INDEXING & ANALYSIS ---
            if gold_ids:
                index_gold_documents.delay(gold_ids)

                # NEW: Customs Intel Analysis (Serious Mode Section 6)
                from app.tasks.custom_intel import analyze_customs_intel
                for g_id in gold_ids:
                    # Trigger analysis for telegram and customs documents
                    analyze_customs_intel.delay(g_id)

            return {
                "status": "success",
                "processed_count": processed_count,
                "gold_ids": gold_ids
            }

        except Exception as e:
            req_logger = RequestLogger(logger, "processor", source_type="mixed") # Fallback logger
            cast('Any', req_logger).error("staging_processing_failed", error=str(e), exc_info=True)
            return {"status": "failed", "error": str(e)}
        finally:
            await conn.close()

    return asyncio.run(run_processor())


# ============================================================================
# 3. INDEXING AGENT - Updates OpenSearch + Qdrant
# ============================================================================

@shared_task(
    name="tasks.workers.index_gold_documents",
    queue="etl",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300
)
def index_gold_documents(self, gold_ids: list):
    """Indexer Agent: Index gold.documents to OpenSearch and Qdrant.

    COMPLEX OPTIMIZATION (v45.1):
    - Reads 'meta' JSONB for extended attributes
    - Handles unified document schema
    - Improved error handling and batch processing
    """
    logger.info("gold_indexing_started", records_count=len(gold_ids))

    async def run_indexer():
        from app.services.embedding_service import get_embedding_service
        from app.services.opensearch_indexer import OpenSearchIndexer
        from app.services.qdrant_service import QdrantService

        db_url = settings.CLEAN_DATABASE_URL
        conn = await asyncpg.connect(db_url)

        opensearch = OpenSearchIndexer()
        embedding_service = get_embedding_service()
        qdrant = QdrantService()

        try:
            # Ensure indices/collections exist
            await qdrant.create_collection()
            await opensearch.create_index("documents_safe")

            # Fetch all documents in this batch
            documents = []

            # UPDATED SELECT: fetching meta and source_type instead of separate columns
            q = """
                SELECT id, title, content, source_type, meta, created_at
                FROM gold.documents
                WHERE id = ANY($1::uuid[])
            """

            rows = await conn.fetch(q, [uuid.UUID(gid) for gid in gold_ids])

            for row in rows:
                # Handle meta JSONB decoding if driver returns string
                meta = row["meta"]
                if isinstance(meta, str):
                    try:
                        meta = json.loads(meta)
                    except json.JSONDecodeError:
                        meta = {}
                elif not meta:
                    meta = {}

                # Map to unified Search Schema
                doc = {
                    "id": str(row["id"]),
                    "title": row["title"] or "Untitled",
                    "content": row["content"] or "",
                    "author": meta.get("author", "Unknown"),
                    "published_date": meta.get("published_date") or row["created_at"].isoformat(),
                    "category": meta.get("category", row["source_type"]),
                    "source": meta.get("connector", row["source_type"]),  # Connector name prefered
                    "source_type": row["source_type"],
                    "url": meta.get("url"),
                    "link": meta.get("link"),
                    "tags": meta.get("tags", []),
                    "created_at": row["created_at"].isoformat()
                }
                documents.append(doc)

            if not documents:
                logger.warning("gold_indexing_skipped", reason="no_docs_found", ids=gold_ids)
                return {"status": "skipped", "reason": "no_docs_found"}

            # Unified Batch Indexing (OpenSearch + Qdrant)
            result = await opensearch.index_documents(
                index_name="documents_safe",
                documents=documents,
                pii_safe=True,
                embedding_service=embedding_service,
                qdrant_service=qdrant
            )

            logger.info("gold_indexing_batch_completed",
                indexed_opensearch=result.get("indexed_opensearch"),
                indexed_qdrant=result.get("indexed_qdrant")
            )

            return {
                "status": "success",
                "indexed_opensearch": result.get("indexed_opensearch", 0),
                "indexed_qdrant": result.get("indexed_qdrant", 0),
                "failed": result.get("failed", 0)
            }

        except Exception as e:
            req_logger = RequestLogger(logger, "indexer", source_type="mixed")
            cast('Any', req_logger).error("gold_indexing_failed", error=str(e), exc_info=True)
            return {"status": "failed", "error": str(e)}
        finally:
            await conn.close()
            await opensearch.close()

    return asyncio.run(run_indexer())


# ============================================================================
# SCHEDULED TASKS (Beat Schedule)
# ============================================================================

@shared_task(name="tasks.workers.scheduled_prozorro_sync")
def scheduled_prozorro_sync():
    """Hourly Prozorro sync (called by Celery Beat)."""
    return parse_external_source.delay("prozorro", {"limit": 100})


@shared_task(name="tasks.workers.scheduled_nbu_sync")
def scheduled_nbu_sync():
    """Daily NBU rates sync (called by Celery Beat)."""
    return parse_external_source.delay("nbu", {})


@shared_task(name="tasks.workers.full_reindex")
def full_reindex():
    """Full reindex of all gold.documents."""
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


@shared_task(name="tasks.workers.orchestrate_data_sources")
def orchestrate_data_sources():
    """Dynamic Scheduler: Checks gold.data_sources for active schedules and triggers parsers.
    Runs every minute (configured in Beat).
    """
    logger.info("scheduler_orchestration_started")

    async def run_scheduler():
        db_url = settings.CLEAN_DATABASE_URL
        conn = await asyncpg.connect(db_url)
        triggered_count = 0

        try:
            # Fetch active sources with schedules
            rows = await conn.fetch("""
                SELECT id, name, source_type, connector, config, schedule
                FROM gold.data_sources
                WHERE status = 'active' AND schedule IS NOT NULL
            """)

            now = datetime.now(UTC)

            for row in rows:
                source_id = str(row["id"])
                schedule = row["schedule"]
                if isinstance(schedule, str):
                    schedule = json.loads(schedule)

                if not schedule or not schedule.get("cron"):
                    continue

                cron_expression = schedule.get("cron")
                last_run_iso = schedule.get("last_run")

                # Determine baseline time for calculation
                if last_run_iso:
                    last_run = datetime.fromisoformat(last_run_iso).replace(tzinfo=UTC)
                else:
                    # If never run, treat as if it ran a long time ago (or run immediately)
                    # Let's verify if 'next' run is due based on NOW
                    last_run = now
                    # Special case: if new source, maybe run immediately?
                    # For safety, let's just check if current minute matches cron
                    # But reliable way: compare cron with previous minute

                # Check using croniter
                # Logic: Did a scheduled time happen between (now - 1 minute) and now?
                # Or simply: Is "next run time" <= now? (Assuming we update last_run correctly)

                if not last_run_iso:
                    should_run = True
                else:
                    iter = croniter(cron_expression, last_run)
                    next_run = iter.get_next(datetime)
                    should_run = next_run <= now

                if should_run:
                    logger.info(f"Triggering scheduled collection for {row['name']} ({row['source_type']})")

                    # Prepare config
                    config = row["config"]
                    if isinstance(config, str):
                        config = json.loads(config)

                    # Add execution context
                    config["source_id"] = source_id

                    # Trigger Task
                    parse_external_source.delay(row["source_type"], config)
                    triggered_count += 1

                    # Update last_run in DB
                    new_last_run = now.isoformat()
                    # Use jsonb_set to update only last_run key
                    await conn.execute("""
                        UPDATE gold.data_sources
                        SET schedule = jsonb_set(coalesce(schedule, '{}'), '{last_run}', $1::jsonb)
                        WHERE id = $2
                    """, json.dumps(new_last_run), row["id"])

            return {"status": "success", "triggered": triggered_count}

        except Exception as e:
            logger.exception(f"scheduler_orchestration_failed: {e}")
            return {"status": "error", "error": str(e)}
        finally:
            await conn.close()

    return asyncio.run(run_scheduler())
