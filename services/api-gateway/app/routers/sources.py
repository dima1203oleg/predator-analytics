from fastapi import APIRouter
from typing import List
import logging
from pydantic import BaseModel
import asyncpg
import os
import json
from datetime import datetime

router = APIRouter(prefix="/sources", tags=["Sources"])
logger = logging.getLogger("api.sources")

class DataSource(BaseModel):
    id: str
    name: str
    type: str # OFFICIAL, INTERNAL, UPLOADED
    status: str # ONLINE, SYNCING
    records_count: int
    size_mb: str # Changed to string to accommodate '12 MB' format from postgres
    last_update: str
    table_name: str
    ml_status: str = "IDLE"

@router.get("/", response_model=List[DataSource])
async def get_data_sources():
    """
    Get all available data sources (PostgreSQL tables).
    Combines legacy staging_ tables with v25 gold.data_sources registry.
    """
    db_url = os.getenv("DATABASE_URL", "postgresql://admin:predator_password@postgres:5432/predator_db")
    # Clean scheme for asyncpg (must be 'postgres' or 'postgresql')
    if '://' in db_url:
        scheme, rest = db_url.split('://', 1)
        if '+' in scheme:
            scheme = scheme.split('+')[0]
        db_url = f"{scheme}://{rest}"

    sources = []
    conn = None
    try:
        conn = await asyncpg.connect(db_url)

        # 1. Query v25 Registry (Gold Layer)
        gold_query = """
            SELECT
                ds.id,
                ds.name,
                ds.source_type,
                ds.status as source_status,
                ds.config,
                ds.updated_at,
                mj.status as ml_job_status
            FROM gold.data_sources ds
            LEFT JOIN gold.ml_datasets md ON (md.dvc_path LIKE '%' || (ds.config->>'table_name') || '%')
            LEFT JOIN (
                SELECT DISTINCT ON (dataset_id) dataset_id, status
                FROM gold.ml_jobs
                ORDER BY dataset_id, created_at DESC
            ) mj ON mj.dataset_id = md.id
            ORDER BY ds.created_at DESC;
        """
        try:
            gold_rows = await conn.fetch(gold_query)
            for row in gold_rows:
                # config is likely a dict or JSON string depending on how asyncpg returns it
                config = row['config']
                if isinstance(config, str):
                    config = json.loads(config)
                config = config or {}

                table_name = config.get("table_name", "gold.registry")

                sources.append({
                    "id": str(row['id']),
                    "name": row['name'],
                    "type": row['source_type'].upper(),
                    "status": "ONLINE",
                    "records_count": config.get("last_count", 0),
                    "size_mb": "LIVE",
                    "last_update": row['updated_at'].strftime("%Y-%m-%d %H:%M") if row['updated_at'] else "N/A",
                    "table_name": table_name,
                    "ml_status": (row['ml_job_status'] or "IDLE").upper()
                })
        except Exception as ge:
            logger.warning(f"Gold registry fetch failed: {ge}")

        # 2. Query Legacy Staging Tables
        legacy_query = """
            SELECT
                tablename as name,
                pg_size_pretty(pg_total_relation_size(quote_ident(tablename))) as size
            FROM pg_catalog.pg_tables
            WHERE schemaname = 'public'
            AND tablename LIKE 'staging_%'
        """
        try:
            legacy_rows = await conn.fetch(legacy_query)
            existing_tables = {s["table_name"] for s in sources}

            for row in legacy_rows:
                table_name = row['name']
                if table_name in existing_tables: continue

                # Get count
                try:
                    count = await conn.fetchval(f"SELECT count(*) FROM {table_name}")
                except:
                    count = 0

                source_type = "UPLOADED"
                if "customs" in table_name: source_type = "OFFICIAL"

                clean_name = table_name.replace("staging_", "").replace("_", " ").upper()
                if "MARCH 2024" in clean_name: clean_name = "🇺🇦 МИТНИЦЯ (БЕРЕЗЕНЬ 2024)"

                sources.append({
                    "id": table_name,
                    "name": clean_name,
                    "type": source_type,
                    "status": "ONLINE",
                    "records_count": count,
                    "size_mb": row['size'] or "0 B",
                    "last_update": "LIVE",
                    "table_name": table_name,
                    "ml_status": "IDLE"
                })
        except Exception as le:
            logger.warning(f"Legacy staging fetch failed: {le}")

        return sources

    except Exception as e:
        logger.error(f"Overall failed to fetch sources: {e}")
        return sources
    finally:
        if conn:
            await conn.close()

@router.get("/connectors")
async def list_connectors():
    return []

@router.get("/secrets")
async def list_secrets():
    return []
