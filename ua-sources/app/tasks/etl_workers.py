"""
UA Sources - Background Workers for TS-Compliant ETL Pipeline
Implements separate Parser, Processor, and Indexer agents as per Technical Specification
"""
from celery import shared_task
from datetime import datetime
import asyncio
import logging
import json

logger = logging.getLogger("tasks.etl_workers")


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
    import asyncpg
    import os
    
    logger.info(f"[PARSER] Starting ingestion from {source_type}")
    
    async def run_parser():
        db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
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
            
            logger.info(f"[PARSER] Fetched {records_fetched} records from {source_type}")
            
            # Trigger processor for new records
            if staging_ids:
                process_staging_records.delay(staging_ids)
            
            return {
                "status": "success",
                "source": source_type,
                "records_fetched": records_fetched,
                "staging_ids": staging_ids
            }
            
        except Exception as e:
            logger.error(f"[PARSER] Failed: {e}")
            return {"status": "failed", "error": str(e)}
        finally:
            await conn.close()
    
    return asyncio.run(run_parser())


# ============================================================================
# 2. DATA PROCESSOR - Transforms staging to gold
# ============================================================================

@shared_task(name="tasks.workers.process_staging_records", queue="etl")
def process_staging_records(staging_ids: list):
    """
    Processor Agent: Transform raw data from staging to gold.documents
    
    Args:
        staging_ids: List of staging.raw_data IDs to process
    
    Returns:
        {status, processed_count, gold_ids}
    """
    import asyncpg
    import os
    
    logger.info(f"[PROCESSOR] Processing {len(staging_ids)} staging records")
    
    async def run_processor():
        db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
        conn = await asyncpg.connect(db_url)
        
        try:
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
            
            logger.info(f"[PROCESSOR] Processed {processed_count} records to gold schema")
            
            # Trigger indexer for new gold records
            if gold_ids:
                index_gold_documents.delay(gold_ids)
            
            return {
                "status": "success",
                "processed_count": processed_count,
                "gold_ids": gold_ids
            }
            
        except Exception as e:
            logger.error(f"[PROCESSOR] Failed: {e}")
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
    Indexer Agent: Index gold.documents to OpenSearch and Qdrant
    
    Args:
        gold_ids: List of gold.documents IDs to index
    
    Returns:
        {status, indexed_opensearch, indexed_qdrant}
    """
    import asyncpg
    import os
    
    logger.info(f"[INDEXER] Indexing {len(gold_ids)} documents")
    
    async def run_indexer():
        from app.services.opensearch_indexer import OpenSearchIndexer
        from app.services.embedding_service import EmbeddingService
        from app.services.qdrant_service import QdrantService
        
        db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
        conn = await asyncpg.connect(db_url)
        
        opensearch = OpenSearchIndexer()
        embedding_service = EmbeddingService()
        qdrant = QdrantService()
        
        try:
            # Ensure indices/collections exist
            await qdrant.create_collection()
            await opensearch.create_index("documents_safe")
            
            # Fetch all documents in this batch
            documents = []
            
            # Use ANY($1) for efficient batch select
            q = "SELECT id, title, content, author, published_date, category, source FROM gold.documents WHERE id = ANY($1::uuid[])"
            # Need to cast string IDs to UUIDs if valid, or handle string IDs. 
            # Assuming 'id' in gold.documents is UUID (based on typical schema). 
            # If ids are strings but column is UUID, need casting. 
            # The gold_ids passed here are likely strings from previous tasks.
            # Let's verify data types. In 'etl_ingestion', id is returned.
            
            rows = await conn.fetch(q, gold_ids)
            
            for row in rows:
                doc = {
                    "id": str(row["id"]),
                    "title": row["title"],
                    "content": row["content"],
                    "author": row["author"],
                    "published_date": row["published_date"].isoformat() if row["published_date"] else None,
                    "category": row["category"],
                    "source": row["source"]
                }
                documents.append(doc)
            
            if not documents:
                logger.warning(f"[INDEXER] No documents found for IDs: {gold_ids}")
                return {"status": "skipped", "reason": "no_docs_found"}

            # Unified Batch Indexing (OpenSearch + Qdrant)
            # Passes services to enable dual indexing logic in opensearch_indexer.py
            result = await opensearch.index_documents(
                index_name="documents_safe", # Should match search router index
                documents=documents,
                pii_safe=True,
                embedding_service=embedding_service,
                qdrant_service=qdrant
            )
            
            logger.info(f"[INDEXER] Batch result: {result}")
            
            return {
                "status": "success",
                "indexed_opensearch": result.get("indexed_opensearch", 0),
                "indexed_qdrant": result.get("indexed_qdrant", 0),
                "failed": result.get("failed", 0)
            }
            
        except Exception as e:
            logger.error(f"[INDEXER] Failed: {e}")
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
    """Hourly Prozorro sync (called by Celery Beat)"""
    return parse_external_source.delay("prozorro", {"limit": 100})


@shared_task(name="tasks.workers.scheduled_nbu_sync")
def scheduled_nbu_sync():
    """Daily NBU rates sync (called by Celery Beat)"""
    return parse_external_source.delay("nbu", {})


@shared_task(name="tasks.workers.full_reindex")
def full_reindex():
    """Full reindex of all gold.documents"""
    import asyncpg
    import os
    
    logger.info("[REINDEX] Starting full reindex")
    
    async def get_all_gold_ids():
        db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
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
