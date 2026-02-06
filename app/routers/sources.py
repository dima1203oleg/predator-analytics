from __future__ import annotations

from datetime import datetime
import json
import logging
import os
from typing import List, Optional
import uuid

import asyncpg
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.tasks.etl_workers import parse_external_source


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

class CreateSourceModel(BaseModel):
    type: str # 'website' or 'telegram'
    url: str
    name: str | None = None
    active: bool = True

class Connector(BaseModel):
    id: str
    name: str
    type: str
    status: str
    lastSync: str
    itemsCount: int
    description: str
    config: dict | None = None

@router.get("/", response_model=list[DataSource])
async def get_data_sources():
    """Get all available data sources (PostgreSQL tables).
    Combines legacy staging_ tables with v25 gold.data_sources registry.
    """
    db_url = os.getenv("DATABASE_URL", "postgresql://admin:predator_password@postgres:5432/predator_db")
    # Clean scheme for asyncpg
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
                mj.status as ml_job_status,
                (SELECT count(*) FROM gold.documents WHERE meta->>'connector' = ds.source_type) as doc_count
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
                    "records_count": row.get('doc_count', 0),
                    "size_mb": "LIVE",
                    "last_update": row['updated_at'].strftime("%Y-%m-%d %H:%M") if row['updated_at'] else "N/A",
                    "table_name": table_name,
                    "ml_status": (row['ml_job_status'] or "IDLE").upper()
                })
        except Exception as ge:
            logger.warning(f"Gold registry fetch failed: {ge}")

        return sources

    except Exception as e:
        logger.exception(f"Overall failed to fetch sources: {e}")
        return sources
    finally:
        if conn:
            await conn.close()

@router.post("/", response_model=dict)
async def create_source(source: CreateSourceModel):
    db_url = os.getenv("DATABASE_URL", "postgresql://admin:predator_password@postgres:5432/predator_db")
    if '://' in db_url:
        scheme, rest = db_url.split('://', 1)
        if '+' in scheme: scheme = scheme.split('+')[0]
        db_url = f"{scheme}://{rest}"

    conn = await asyncpg.connect(db_url)
    try:
        # Prepare Config
        config = {}
        source_type = "web" if source.type == "website" else source.type

        if source_type == "telegram":
            # Extract username
            username = source.url.replace("https://t.me/", "").replace("@", "").strip('/')
            config["channelUsername"] = username
            config["url"] = source.url
            name = source.name or f"Telegram: {username}"
            description = f"Моніторинг каналу @{username}"
        elif source_type == "web":
            config["url"] = source.url
            config["usePlaywright"] = True
            name = source.name or source.url
            description = f"Скрапінг сайту {source.url}"
        else:
            config["url"] = source.url
            name = source.name or source.url
            description = "Зовнішнє джерело"

        # Insert into gold.data_sources
        source_id = await conn.fetchval("""
            INSERT INTO gold.data_sources
                (name, source_type, status, config, schedule, created_at, updated_at)
            VALUES ($1, $2, 'active', $3, $4, NOW(), NOW())
            RETURNING id
        """, name, source_type, json.dumps(config), json.dumps({"cron": "* * * * *"})) # Schedule every minute for testing

        logger.info(f"Created source {source_id}")

        # Trigger Initial Sync
        parse_external_source.delay(source_type, config)

        return {"status": "created", "id": str(source_id)}

    except Exception as e:
        logger.error(f"Failed to create source: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await conn.close()

@router.get("/connectors", response_model=list[Connector])
async def list_connectors():
    """Endpoint for ParsersView UI"""
    db_url = os.getenv("DATABASE_URL", "postgresql://admin:predator_password@postgres:5432/predator_db")
    if '://' in db_url:
        scheme, rest = db_url.split('://', 1)
        if '+' in scheme: scheme = scheme.split('+')[0]
        db_url = f"{scheme}://{rest}"

    conn = await asyncpg.connect(db_url)
    connectors = []
    try:
        # Fetch from gold.data_sources
        rows = await conn.fetch("""
            SELECT
                ds.id, ds.name, ds.source_type, ds.status, ds.updated_at, ds.config,
                (SELECT count(*) FROM gold.documents WHERE meta->>'connector' = ds.source_type OR meta->>'original_source' = ds.source_type) as count
            FROM gold.data_sources ds
            WHERE status != 'archived'
            ORDER BY created_at DESC
        """)

        for row in rows:
            conf = row['config']
            if isinstance(conf, str): conf = json.loads(conf)
            conf = conf or {}

            # Map type to frontend type
            ftype = row['source_type']
            if ftype == 'web': ftype = 'website'

            connectors.append({
                "id": str(row['id']),
                "name": row['name'],
                "type": ftype,
                "status": row['status'] if row['status'] in ['active', 'syncing', 'error'] else 'idle',
                "lastSync": row['updated_at'].strftime("%H:%M %d.%m") if row['updated_at'] else "Never",
                "itemsCount": row['count'] or 0,
                "description": conf.get('url') or row['name'],
                "config": conf
            })

    except Exception as e:
        logger.error(f"Failed to list connectors: {e}")
    finally:
        await conn.close()

    return connectors
